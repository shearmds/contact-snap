import Foundation

struct ContactInfo: Codable, Equatable, Hashable {
    var firstName: String = ""
    var lastName: String = ""
    var company: String = ""
    var jobTitle: String = ""
    var email: String = ""
    var phone: String = ""
    var address: String = ""
    var website: String = ""

    var displayName: String {
        let full = [firstName, lastName].filter { !$0.isEmpty }.joined(separator: " ")
        return full.isEmpty ? company : full
    }

    var isEmpty: Bool {
        [firstName, lastName, company, jobTitle, email, phone, address, website]
            .allSatisfy { $0.isEmpty }
    }
}
