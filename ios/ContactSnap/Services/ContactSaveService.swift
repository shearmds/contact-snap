import Contacts

enum ContactSaveError: LocalizedError {
    case accessDenied
    case saveFailed(Error)

    var errorDescription: String? {
        switch self {
        case .accessDenied:
            return "Contacts access was denied. Please enable it in Settings."
        case .saveFailed(let e):
            return "Failed to save contact: \(e.localizedDescription)"
        }
    }
}

struct ContactSaveService {
    static func save(_ info: ContactInfo) async throws {
        let store = CNContactStore()

        let status = CNContactStore.authorizationStatus(for: .contacts)
        if status == .notDetermined {
            let granted = try await store.requestAccess(for: .contacts)
            guard granted else { throw ContactSaveError.accessDenied }
        } else if status != .authorized {
            throw ContactSaveError.accessDenied
        }

        let contact = CNMutableContact()
        contact.givenName = info.firstName
        contact.familyName = info.lastName
        contact.organizationName = info.company
        contact.jobTitle = info.jobTitle

        if !info.email.isEmpty {
            contact.emailAddresses = [CNLabeledValue(label: CNLabelWork, value: info.email as NSString)]
        }

        if !info.phone.isEmpty {
            contact.phoneNumbers = [CNLabeledValue(label: CNLabelWork, value: CNPhoneNumber(stringValue: info.phone))]
        }

        if !info.address.isEmpty {
            let postal = CNMutablePostalAddress()
            postal.street = info.address
            contact.postalAddresses = [CNLabeledValue(label: CNLabelWork, value: postal)]
        }

        if !info.website.isEmpty {
            contact.urlAddresses = [CNLabeledValue(label: CNLabelWork, value: info.website as NSString)]
        }

        let saveRequest = CNSaveRequest()
        saveRequest.add(contact, toContainerWithIdentifier: nil)

        do {
            try store.execute(saveRequest)
        } catch {
            throw ContactSaveError.saveFailed(error)
        }
    }
}
