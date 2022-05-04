#import <Foundation/Foundation.h>
#import "RNQueueitWebviewManager.h"
#import "RNQueueitWebview.h"

#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#import "UIView+React.h"
#import "RCTLog.h"


@implementation RNQueueitWebviewManager
RCT_EXPORT_MODULE(RNQueueitWebview)
@synthesize bridge = _bridge;


RCT_EXPORT_VIEW_PROPERTY(customerId, NSString)
RCT_EXPORT_VIEW_PROPERTY(waitingRoomId, NSString)
RCT_EXPORT_VIEW_PROPERTY(layoutName, NSString)
RCT_EXPORT_VIEW_PROPERTY(language, NSString)

RCT_EXPORT_VIEW_PROPERTY(onStatusChanged, RCTBubblingEventBlock)

- (UIView *)view
{
    // Create the webview here
    UIView *view = [[RNQueueitWebview alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
    
    return view;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

#pragma mark RNQueueitWebviewDelegate


@end
