import Combine
import Foundation
import QueueItKit
import UIKit
import WebKit

/// One waiting-room run on the Swift SDK. The module shim hands it everything it needs from React
/// (the screen to present on and the callbacks that settle the promise and send events), so this file
/// imports no React code.
@objc @MainActor
public final class QueueItRunner: NSObject {
    private static var liveRuns: [QueueItRunner] = []
    private static var dismissalsInFlight = 0
    private static var afterDismissals: [() -> Void] = []

    private let presenter: () -> UIViewController?
    private let resolve: (String, String, String?) -> Void
    private let reject: (String, String, String?) -> Void
    private let emit: (String, [String: String]?) -> Void
    private let inviteCode: String?

    private var engine: QueueItEngine!
    private var visibilitySubscription: AnyCancellable?
    private var room: QueueWebViewController?
    private var isPresenting = false
    private var roomToDismissOncePresented: QueueWebViewController?
    private var isPromiseSettled = false
    private var mustHideRoom = false
    private var isFinished = false
    private var hasRoomOpened = false

    @objc public init(
        customerId: String,
        waitingRoomOrAliasId: String,
        layoutName: String?,
        language: String?,
        waitingRoomDomain: String?,
        queuePathPrefix: String?,
        inviteCode: String?,
        presenter: @escaping () -> UIViewController?,
        resolve: @escaping (String, String, String?) -> Void,
        reject: @escaping (String, String, String?) -> Void,
        emit: @escaping (String, [String: String]?) -> Void
    ) {
        self.inviteCode = inviteCode
        self.presenter = presenter
        self.resolve = resolve
        self.reject = reject
        self.emit = emit
        super.init()

        engine = QueueItEngine(
            customerId: customerId,
            waitingRoomOrAliasId: waitingRoomOrAliasId,
            queueListener: self,
            themeName: layoutName,
            language: language,
            waitingRoomDomain: waitingRoomDomain,
            queuePathPrefix: queuePathPrefix
        )
        visibilitySubscription = engine.viewManager.$showWebView
            .removeDuplicates()
            .dropFirst()
            .receive(on: DispatchQueue.main)
            .sink { [weak self] isShown in
                self?.roomVisibilityChanged(isShown)
            }
    }

    @objc public func run() {
        begin { await $0.run() }
    }

    @objc public func runWithEnqueueToken(_ enqueueToken: String) {
        begin { await $0.runWithEnqueueToken(enqueueToken) }
    }

    @objc public func runWithEnqueueKey(_ enqueueKey: String) {
        begin { await $0.runWithEnqueueKey(enqueueKey) }
    }

    @objc public func showQueue(queueUrl: String, targetUrl: String, queueItToken: String, urlTTLInMinutes: Int) {
        let queueTryPassResult = QueueTryPassResult(
            queueItToken: queueItToken,
            queueUrl: queueUrl,
            targetUrl: targetUrl,
            isPassedThrough: false,
            redirectType: .queue,
            urlTTLInMinutes: urlTTLInMinutes
        )
        begin { $0.showQueue(queueTryPassResult: queueTryPassResult) }
    }

    private func begin(_ start: @escaping (QueueItEngine) async -> Void) {
        Self.liveRuns.forEach { $0.finish() }
        Self.liveRuns.append(self)
        let engine = self.engine!
        let inviteCode = self.inviteCode
        Task {
            if let inviteCode { await engine.setInviteCode(inviteCode) }
            await start(engine)
        }
    }

    private func roomVisibilityChanged(_ isShown: Bool) {
        guard !isFinished else { return }
        if isShown {
            Self.afterDismissalsFinish { [weak self] in self?.presentRoom() }
        } else {
            dismissRoom()
            if mustHideRoom { finish() }
        }
    }

    private func presentRoom() {
        guard !isFinished, room == nil else { return }
        if mustHideRoom {
            engine.viewManager.hideQueue()
            return
        }
        guard engine.viewManager.showWebView else { return }
        guard let host = presenter() else {
            settleOnce { reject("error", "No screen is available to show the waiting room on", nil) }
            hideRoomAfterError()
            finish()
            return
        }
        let room = QueueWebViewController(viewManager: engine.viewManager)
        room.modalPresentationStyle = .fullScreen
        self.room = room
        isPresenting = true
        host.present(room, animated: true) { self.roomPresented() }
    }

    private func roomPresented() {
        isPresenting = false
        guard let room = roomToDismissOncePresented else { return }
        roomToDismissOncePresented = nil
        startDismissal(of: room)
    }

    private func dismissRoom() {
        guard let room else { return }
        self.room = nil
        guard room.presentingViewController != nil else { return }
        Self.dismissalsInFlight += 1
        // UIKit ignores a dismissal requested during the present animation and never calls its completion.
        if isPresenting {
            roomToDismissOncePresented = room
        } else {
            startDismissal(of: room)
        }
    }

    private func startDismissal(of room: QueueWebViewController) {
        guard let host = room.presentingViewController else {
            Self.dismissalFinished()
            return
        }
        // Dismissing from the host closes the room even when something is shown on top of it.
        host.dismiss(animated: true) { Self.dismissalFinished() }
    }

    private static func afterDismissalsFinish(_ action: @escaping () -> Void) {
        if dismissalsInFlight == 0 {
            action()
        } else {
            afterDismissals.append(action)
        }
    }

    private static func dismissalFinished() {
        dismissalsInFlight -= 1
        guard dismissalsInFlight == 0 else { return }
        let actions = afterDismissals
        afterDismissals = []
        actions.forEach { $0() }
    }

    private func settleOnce(_ settle: () -> Void) {
        guard !isPromiseSettled else { return }
        isPromiseSettled = true
        settle()
    }

    private func complete(state: String, token: String?) {
        guard !isFinished else { return }
        settleOnce { resolve(state, token ?? "", nil) }
        finish()
    }

    private func fail(_ message: String, errorCode: String) {
        settleOnce { reject("error", message, errorCode) }
        hideRoomAfterError()
    }

    private func hideRoomAfterError() {
        let roomWasNeverShown = !engine.viewManager.showWebView && room == nil
        mustHideRoom = true
        engine.viewManager.hideQueue()
        if roomWasNeverShown { finish() }
    }

    private func finish(waitingForLeaveRequest: Bool = false) {
        guard !isFinished else { return }
        isFinished = true
        visibilitySubscription = nil
        engine.queueListener = nil
        engine.viewManager.queueListener = nil
        dismissRoom()
        Self.liveRuns.removeAll { $0 === self }
        PageTeardown.schedule(for: engine, waitingForLeaveRequest: waitingForLeaveRequest)
    }
}

extension QueueItRunner: @preconcurrency QueueListener {
    public func onQueuePassed(_ queuePassedInfo: QueuePassedInfo) {
        complete(state: "Passed", token: queuePassedInfo.queueItToken)
    }

    public func onQueueViewWillOpen() {
        guard !isFinished, !mustHideRoom else { return }
        hasRoomOpened = true
        emit("openingQueueView", nil)
    }

    public func onQueueDisabled(_ queueDisabledInfo: QueueDisabledInfo) {
        complete(state: "Disabled", token: queueDisabledInfo.queueItToken)
    }

    public func onQueueItUnavailable() {
        complete(state: "Unavailable", token: nil)
    }

    public func onError(_ error: QueueError, errorMessage: String) {
        guard !isFinished else { return }
        // Once the visitor is in the waiting room, a lost connection must not let them past it.
        if error.code == .noConnection && !hasRoomOpened {
            settleOnce { resolve("Unavailable", "", error.code.rawValue) }
            hideRoomAfterError()
        } else {
            fail(errorMessage, errorCode: error.code.rawValue)
        }
    }

    public func onSSLError(_ errorMessage: String) {
        guard !isFinished else { return }
        fail(errorMessage, errorCode: "SSL_ERROR")
    }

    public func onQueueUrlChanged(_ url: String) {
        guard !isFinished else { return }
        emit("queueUrlChanged", ["url": url])
    }

    public func onWebViewClosed() {
        guard !isFinished else { return }
        emit("webViewClosed", nil)
        finish()
    }

    // hideQueue() is not called here: it would cancel the leave request that frees the visitor's place.
    public func onUserExited() {
        guard !isFinished else { return }
        emit("userExited", nil)
        finish(waitingForLeaveRequest: true)
    }

    public func onSessionRestart() {
        complete(state: "RestartedSession", token: nil)
    }
}

private let emptyPage = URL(string: "about:blank")!
private var sinkKey = 0
private var watchKey = 0

/// Stops the page of a finished run and cuts it off from the app. The delegates are never set to nil: a
/// monitoring SDK that keeps its own proxy when nil is set would forward the next navigation decision to a
/// released target.
@MainActor
private enum PageTeardown {
    // The engine, its view manager and the web view stay alive until the teardown has run. A leave request
    // that frees the visitor's place is in flight when the page is left through its exit link, so the page
    // is stopped only once it stops loading, or after 5 seconds.
    static func schedule(for engine: QueueItEngine, waitingForLeaveRequest: Bool) {
        let viewManager = engine.viewManager
        DispatchQueue.main.async {
            MainActor.assumeIsolated {
                let webView = viewManager.webView
                installSink(on: webView)
                let stopPage = {
                    stopAndBlank(webView)
                    watchForLoads(of: webView)
                    withExtendedLifetime((engine, viewManager)) {}
                }
                if waitingForLeaveRequest {
                    _ = LoadingStopWait(webView: webView, timeout: 5, action: stopPage)
                } else {
                    stopPage()
                }
            }
        }
    }

    private static func stopAndBlank(_ webView: WKWebView) {
        webView.stopLoading()
        webView.load(URLRequest(url: emptyPage))
    }

    private static func installSink(on webView: WKWebView) {
        let sink = objc_getAssociatedObject(webView, &sinkKey) as? InertPageDelegate ?? InertPageDelegate()
        objc_setAssociatedObject(webView, &sinkKey, sink, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        webView.navigationDelegate = sink
        webView.uiDelegate = sink
    }

    // QueueItKit loads the page again on a later turn when a replaced run was still enqueuing or when it
    // shows the page after reporting an error, and it may attach its view manager as delegate again first.
    private static func watchForLoads(of webView: WKWebView) {
        guard objc_getAssociatedObject(webView, &watchKey) == nil else { return }
        let watch = webView.observe(\.url, options: [.new]) { [weak webView] _, change in
            guard let url = change.newValue ?? nil, url != emptyPage else { return }
            MainActor.assumeIsolated {
                guard let webView else { return }
                let delegates = [webView.navigationDelegate, webView.uiDelegate]
                DispatchQueue.main.async {
                    MainActor.assumeIsolated {
                        // Stopping the page itself makes the url fall back to the last committed page for a moment.
                        guard let url = webView.url, url != emptyPage else { return }
                        withExtendedLifetime(delegates) {
                            installSink(on: webView)
                            stopAndBlank(webView)
                        }
                    }
                }
            }
        }
        objc_setAssociatedObject(webView, &watchKey, watch, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }
}

@MainActor
private final class LoadingStopWait {
    private var observation: NSKeyValueObservation?
    private var action: (() -> Void)?

    init(webView: WKWebView, timeout: TimeInterval, action: @escaping () -> Void) {
        self.action = action
        observation = webView.observe(\.isLoading, options: [.old, .new]) { [weak self] _, change in
            guard change.oldValue == true, change.newValue == false else { return }
            MainActor.assumeIsolated { self?.complete() }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + timeout) {
            MainActor.assumeIsolated { self.complete() }
        }
    }

    private func complete() {
        observation = nil
        guard let action else { return }
        self.action = nil
        action()
    }
}

/// Allows every navigation and answers every page request at once, so nothing is left waiting.
@MainActor
private final class InertPageDelegate: NSObject, WKNavigationDelegate, WKUIDelegate {
    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        decisionHandler(.allow)
    }

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        preferences: WKWebpagePreferences,
        decisionHandler: @escaping (WKNavigationActionPolicy, WKWebpagePreferences) -> Void
    ) {
        decisionHandler(.allow, preferences)
    }

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationResponse: WKNavigationResponse,
        decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void
    ) {
        decisionHandler(.allow)
    }

    func webView(
        _ webView: WKWebView,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        completionHandler(.performDefaultHandling, nil)
    }

    func webView(
        _ webView: WKWebView,
        runJavaScriptAlertPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping () -> Void
    ) {
        completionHandler()
    }

    func webView(
        _ webView: WKWebView,
        runJavaScriptConfirmPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (Bool) -> Void
    ) {
        completionHandler(false)
    }

    func webView(
        _ webView: WKWebView,
        runJavaScriptTextInputPanelWithPrompt prompt: String,
        defaultText: String?,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (String?) -> Void
    ) {
        completionHandler(nil)
    }

    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        nil
    }
}
