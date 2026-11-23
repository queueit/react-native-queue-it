#if DEBUG

#import <WebKit/WebKit.h>
#import <objc/runtime.h>

// A stand-in for a monitoring SDK that wraps the navigation delegate of every web view. It does nothing
// unless the app is launched with `-QueueItMonitorStandIn pass|wrap|keep`.
//   pass: a non-nil delegate is replaced with a proxy that holds it weakly; nil passes through.
//   wrap: as pass, but nil is wrapped too, in a proxy with no target.
//   keep: as pass, but nil is ignored, so the earlier proxy stays installed.

@interface QueueItStandInProxy : NSProxy
- (instancetype)initWithTarget:(id)target;
@end

@implementation QueueItStandInProxy {
  __weak id _target;
}

- (instancetype)initWithTarget:(id)target
{
  _target = target;
  return self;
}

- (BOOL)respondsToSelector:(SEL)selector
{
  id target = _target;
  if (target) {
    return [target respondsToSelector:selector];
  }
  return [QueueItStandInProxy protocolMethodDescriptionFor:selector].name != NULL;
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)selector
{
  id target = _target;
  NSMethodSignature *signature = [target methodSignatureForSelector:selector];
  if (signature) {
    return signature;
  }
  const char *types = [QueueItStandInProxy protocolMethodDescriptionFor:selector].types;
  return [NSMethodSignature signatureWithObjCTypes:types ?: "v@:"];
}

- (void)forwardInvocation:(NSInvocation *)invocation
{
  id target = _target;
  if ([target respondsToSelector:invocation.selector]) {
    [invocation invokeWithTarget:target];
  }
}

+ (struct objc_method_description)protocolMethodDescriptionFor:(SEL)selector
{
  struct objc_method_description description = protocol_getMethodDescription(@protocol(WKNavigationDelegate), selector, NO, YES);
  if (description.name == NULL) {
    description = protocol_getMethodDescription(@protocol(WKNavigationDelegate), selector, YES, YES);
  }
  return description;
}

@end

@interface QueueItMonitorStandIn : NSObject
@end

static NSString *StandInMode;
static IMP OriginalSetNavigationDelegate;
static const void *ProxyKey = &ProxyKey;
static NSMutableArray<WKWebView *> *WrappedWebViews;

static void NavigateIdleWebViews(void)
{
  for (WKWebView *webView in WrappedWebViews) {
    if (webView.URL != nil && webView.window == nil) {
      [webView loadRequest:[NSURLRequest requestWithURL:webView.URL]];
    }
  }
}

static void KeepAlive(WKWebView *webView)
{
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    WrappedWebViews = [NSMutableArray new];
    [NSTimer scheduledTimerWithTimeInterval:2 repeats:YES block:^(NSTimer *_) {
      NavigateIdleWebViews();
    }];
  });
  if (![WrappedWebViews containsObject:webView]) {
    [WrappedWebViews addObject:webView];
  }
}

static void SetNavigationDelegate(WKWebView *webView, SEL selector, id<WKNavigationDelegate> delegate)
{
  void (*original)(id, SEL, id) = (void (*)(id, SEL, id))OriginalSetNavigationDelegate;
  if (delegate == nil && [StandInMode isEqualToString:@"keep"]) {
    return;
  }
  if (delegate == nil && ![StandInMode isEqualToString:@"wrap"]) {
    original(webView, selector, nil);
    return;
  }
  QueueItStandInProxy *proxy = [[QueueItStandInProxy alloc] initWithTarget:delegate];
  objc_setAssociatedObject(webView, ProxyKey, proxy, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  KeepAlive(webView);
  original(webView, selector, (id<WKNavigationDelegate>)proxy);
}

@implementation QueueItMonitorStandIn

+ (void)load
{
  NSString *mode = [[NSUserDefaults standardUserDefaults] stringForKey:@"QueueItMonitorStandIn"];
  if (![@[@"pass", @"wrap", @"keep"] containsObject:mode]) {
    return;
  }
  StandInMode = mode;
  Method method = class_getInstanceMethod([WKWebView class], @selector(setNavigationDelegate:));
  OriginalSetNavigationDelegate = method_setImplementation(method, (IMP)SetNavigationDelegate);
}

@end

#endif
