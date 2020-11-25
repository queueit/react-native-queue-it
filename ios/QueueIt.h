#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTUtils.h>
#import <QueueITLibrary/QueueITEngine.h>
#import <QueueITLibrary/QueueService.h>
#define ENQUEUE_STATE(x) \
    (EnqueueResultState_toString[x])

typedef enum {
    Passed,
    Disabled,
    Unavailable
} EnqueueResultState;

extern NSString * const EnqueueResultState_toString[];

@interface QueueIt : RCTEventEmitter <RCTBridgeModule, QueuePassedDelegate, QueueViewWillOpenDelegate, QueueDisabledDelegate, QueueITUnavailableDelegate, QueueUserExitedDelegate, QueueNavigationActionDelegate, QueueViewClosedDelegate>

@end
