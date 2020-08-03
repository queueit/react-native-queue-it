#import "QueueCache.h"

static NSString * KEY_TO_CACHE;
static NSString * const KEY_URL_TTL = @"urlTTL";
static NSString * const KEY_QUEUE_URL = @"queueUrl";
static NSString * const KEY_TARGET_URL = @"targetUrl";

@implementation QueueCache

+ (QueueCache *)instance:(NSString *)customerId eventId:(NSString*)eventId;
{
    KEY_TO_CACHE = [NSString stringWithFormat:@"%@-%@",customerId, eventId];
    static QueueCache *queueCache = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        queueCache = [[self alloc] init];
    });
    
    return queueCache;
}

-(BOOL)isEmpty {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    if ([defaults dictionaryForKey:KEY_TO_CACHE]) {
        return NO;
    }
    else {
        NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
        return [defaults dictionaryForKey:KEY_TO_CACHE] == nil;
    }
}

-(NSString*) getUrlTtl {
    if ([self isEmpty]) {
        [self raiseException];
    }
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    return [defaults dictionaryForKey:KEY_TO_CACHE][KEY_URL_TTL];
}

-(NSString*) getQueueUrl {
    if ([self isEmpty]) {
        [self raiseException];
    }
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    return [defaults dictionaryForKey:KEY_TO_CACHE][KEY_QUEUE_URL];
}

-(NSString*) getTargetUrl {
    if ([self isEmpty]) {
        [self raiseException];
    }
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    return [defaults dictionaryForKey:KEY_TO_CACHE][KEY_TARGET_URL];
}

-(void)update:(NSString*)queueUrl urlTTL:(NSString*)urlTtlString targetUrl:(NSString*)targetUrl
{
    NSMutableDictionary *values = [NSMutableDictionary dictionary];
    [values setObject:queueUrl forKey:KEY_QUEUE_URL];
    [values setObject:urlTtlString forKey:KEY_URL_TTL];
    [values setObject:targetUrl forKey:KEY_TARGET_URL];
    
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setValue:values forKey:KEY_TO_CACHE];
    [defaults synchronize];
}

-(void)clear {
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:KEY_TO_CACHE];
    [[NSUserDefaults standardUserDefaults] synchronize];
}

-(void)raiseException {
    @throw [NSException exceptionWithName:@"InvalidOperationException" reason:@"trying to get an item from empty cache" userInfo:nil];
}

@end
