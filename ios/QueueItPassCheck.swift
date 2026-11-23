import Foundation
import QueueItKit

/// One pass check on the Swift SDK: asks whether the visitor already holds a pass and settles once. The
/// module shim hands it the callbacks that settle the promise, so this file imports no React code.
@objc @MainActor
public final class QueueItPassCheck: NSObject {
    private let resolve: ([String: Any]) -> Void
    private let reject: (String, String, String?) -> Void
    private let inviteCode: String?

    private var engine: QueueItEngine?
    private var keepAlive: QueueItPassCheck?
    private var isSettled = false

    @objc public init(
        customerId: String,
        waitingRoomOrAliasId: String,
        layoutName: String?,
        language: String?,
        waitingRoomDomain: String?,
        queuePathPrefix: String?,
        inviteCode: String?,
        resolve: @escaping ([String: Any]) -> Void,
        reject: @escaping (String, String, String?) -> Void
    ) {
        self.inviteCode = inviteCode
        self.resolve = resolve
        self.reject = reject
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
    }

    @objc public func tryPass() {
        begin { await $0.tryPass() }
    }

    @objc public func tryPassWithEnqueueToken(_ enqueueToken: String) {
        begin { await $0.tryPass(enqueueToken: enqueueToken) }
    }

    @objc public func tryPassWithEnqueueKey(_ enqueueKey: String) {
        begin { await $0.tryPass(enqueueKey: enqueueKey) }
    }

    private func begin(_ check: @escaping (QueueItEngine) async -> QueueTryPassResult?) {
        guard let engine else { return }
        keepAlive = self
        let inviteCode = self.inviteCode
        Task {
            if let inviteCode { await engine.setInviteCode(inviteCode) }
            let result = await check(engine)
            if let result {
                settleOnce { resolve(Self.map(of: result)) }
            } else {
                // Queued behind any listener call the SDK made before returning, so the listener's outcome wins.
                DispatchQueue.main.async { [self] in
                    settleOnce { reject("error", "The pass check ended without a result", nil) }
                }
            }
        }
    }

    private static func map(of result: QueueTryPassResult) -> [String: Any] {
        [
            "queueittoken": result.queueItToken ?? "",
            "queueUrl": result.queueUrl ?? "",
            "targetUrl": result.targetUrl ?? "",
            "urlTTLInMinutes": result.urlTTLInMinutes ?? 0,
            "redirectType": result.redirectType.rawValue,
        ]
    }

    private func settleOnce(_ settle: () -> Void) {
        guard !isSettled else { return }
        isSettled = true
        settle()
        engine = nil
        keepAlive = nil
    }

    private func unavailable(errorCode: String?) {
        settleOnce {
            var map: [String: Any] = ["queueittoken": "", "state": "Unavailable"]
            if let errorCode { map["errorCode"] = errorCode }
            resolve(map)
        }
    }

    private func fail(_ message: String, errorCode: String) {
        settleOnce { reject("error", message, errorCode) }
    }
}

extension QueueItPassCheck: QueueListener {
    nonisolated public func onQueuePassed(_ queuePassedInfo: QueuePassedInfo) {}

    nonisolated public func onQueueViewWillOpen() {}

    nonisolated public func onQueueDisabled(_ queueDisabledInfo: QueueDisabledInfo) {}

    nonisolated public func onQueueItUnavailable() {
        DispatchQueue.main.async { [self] in unavailable(errorCode: nil) }
    }

    nonisolated public func onError(_ error: QueueError, errorMessage: String) {
        let code = error.code
        DispatchQueue.main.async { [self] in
            if code == .noConnection {
                unavailable(errorCode: code.rawValue)
            } else {
                fail(errorMessage, errorCode: code.rawValue)
            }
        }
    }

    nonisolated public func onSSLError(_ errorMessage: String) {
        DispatchQueue.main.async { [self] in fail(errorMessage, errorCode: "SSL_ERROR") }
    }
}
