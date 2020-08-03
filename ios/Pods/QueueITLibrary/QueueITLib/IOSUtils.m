#import <WebKit/WebKit.h>
#import "IOSUtils.h"

@implementation IOSUtils
WKWebView* webView;

+(NSString*)getUserId{
    UIDevice* device = [[UIDevice alloc]init];
    NSUUID* deviceid = [device identifierForVendor];
    NSString* uuid = [deviceid UUIDString];
    return uuid;
}

+(void)getUserAgent:(void (^)(NSString*))completionHandler{
    WKWebView* view = [[WKWebView alloc] initWithFrame:CGRectZero];
    [view evaluateJavaScript:@"navigator.userAgent" completionHandler:^(id _Nullable userAgent, NSError * _Nullable error) {
        if (error == nil) {
            completionHandler(userAgent);
        }
        else {
            NSLog(@"Error getting userAgent");
            NSLog(@"%@", [error localizedDescription]);
            completionHandler(@"");
        }
    }];
    
    webView = view;
}

+(NSString*)getLibraryVersion{
    NSDictionary *infoDictionary = [[NSBundle mainBundle]infoDictionary];
    
    NSString *libName = infoDictionary[(NSString *)kCFBundleNameKey];
    NSString * major = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
    NSString *minor = infoDictionary[(NSString*)kCFBundleVersionKey];
    NSString* libversion = [NSString stringWithFormat:@"%@-%@.%@", libName, major, minor];
    
    return libversion;
}

+(NSString*)getSdkVersion{
    return @"iOS-3.0.0";
}

@end
