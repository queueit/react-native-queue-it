#import <Foundation/Foundation.h>

@interface QueuePassedInfo : NSObject

@property (nonatomic, strong) NSString* queueitToken;

-(instancetype)initWithQueueitToken: (NSString*) queueitToken;

@end
