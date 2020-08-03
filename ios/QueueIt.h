#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTUtils.h>
#import <QueueITEngine.h>
#import <QueueService.h>
#define ENQUEUE_STATE(x) \
    (EnqueueResultState_toString[x])

typedef enum {
    Passed,
    Disabled,
    Unavailable
} EnqueueResultState;

extern NSString * const EnqueueResultState_toString[];

@interface QueueIt : RCTEventEmitter <RCTBridgeModule, QueuePassedDelegate, QueueViewWillOpenDelegate, QueueDisabledDelegate, QueueITUnavailableDelegate, QueueUserExitedDelegate>

@end
