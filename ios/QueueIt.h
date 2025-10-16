#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTUtils.h>
#import <QueueITLibrary/QueueITEngine.h>
#import <QueueITLibrary/QueueService.h>
#import <ReactNativeQueueIt/ReactNativeQueueIt.h>
#define ENQUEUE_STATE(x) \
    (EnqueueResultState_toString[x])

typedef enum {
    Passed,
    Disabled,
    Unavailable,
    RestartedSession
} EnqueueResultState;

extern NSString * const EnqueueResultState_toString[];

@interface QueueIt : RCTEventEmitter <RCTBridgeModule, NativeQueueItSpec, QueuePassedDelegate, QueueViewWillOpenDelegate, QueueDisabledDelegate, QueueITUnavailableDelegate, QueueUserExitedDelegate, QueueViewClosedDelegate, QueueSessionRestartDelegate>

@end