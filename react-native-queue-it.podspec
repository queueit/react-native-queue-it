require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-queue-it"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "15.0" }
  s.swift_version = "5.0"
  s.source       = { :git => "https://github.com/queueit/react-native-queue-it.git", :tag => "#{s.version}" }


  s.source_files = "ios/*.{h,m,mm,swift}"
  s.private_header_files = "ios/*.h"
  s.vendored_frameworks = "ios/QueueItKit.xcframework"

  install_modules_dependencies(s)
end
