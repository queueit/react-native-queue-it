#import <Foundation/Foundation.h>

@interface QueueStatus : NSObject

@property (nonatomic, strong) NSString* queueId;
@property (nonatomic, strong)NSString* queueUrlString;
@property (nonatomic, strong) NSString* eventTargetUrl;
@property (nonatomic, strong) NSString* queueitToken;
@property int queueUrlTTL;

-(instancetype)initWithDictionary:(NSDictionary *)dictionary;

@end
