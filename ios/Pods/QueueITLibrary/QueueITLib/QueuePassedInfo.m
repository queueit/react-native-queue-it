#import "QueuePassedInfo.h"

@implementation QueuePassedInfo

-(instancetype)initWithQueueitToken:(NSString *)queueitToken
{
    if(self = [super init]) {
        self.queueitToken = queueitToken;
    }
    
    return self;
}

@end
