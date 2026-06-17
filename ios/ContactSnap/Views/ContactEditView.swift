import SwiftUI

struct ContactEditView: View {
    @Environment(\.dismiss) private var dismiss
    @State var contact: ContactInfo
    @State private var isSaving = false
    @State private var saveError: String?
    @State private var saved = false

    var body: some View {
        Form {
            Section("Name") {
                LabeledTextField("First Name", text: $contact.firstName)
                LabeledTextField("Last Name", text: $contact.lastName)
            }

            Section("Work") {
                LabeledTextField("Company", text: $contact.company)
                LabeledTextField("Job Title", text: $contact.jobTitle)
            }

            Section("Contact") {
                LabeledTextField("Email", text: $contact.email, keyboardType: .emailAddress)
                LabeledTextField("Phone", text: $contact.phone, keyboardType: .phonePad)
            }

            Section("Other") {
                LabeledTextField("Address", text: $contact.address)
                LabeledTextField("Website", text: $contact.website, keyboardType: .URL)
            }
        }
        .navigationTitle(contact.displayName.isEmpty ? "New Contact" : contact.displayName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button {
                    saveContact()
                } label: {
                    if isSaving {
                        ProgressView()
                    } else {
                        Text("Save")
                    }
                }
                .disabled(isSaving || contact.isEmpty)
            }
        }
        .alert("Save Error", isPresented: Binding(
            get: { saveError != nil },
            set: { if !$0 { saveError = nil } }
        )) {
            Button("OK", role: .cancel) { saveError = nil }
        } message: {
            Text(saveError ?? "")
        }
        .alert("Contact Saved", isPresented: $saved) {
            Button("Done") {
                dismiss()
                dismiss() // pop back to root
            }
        } message: {
            Text("\(contact.displayName) has been added to your Contacts.")
        }
    }

    private func saveContact() {
        isSaving = true
        Task {
            defer { isSaving = false }
            do {
                try await ContactSaveService.save(contact)
                saved = true
            } catch {
                saveError = error.localizedDescription
            }
        }
    }
}

private struct LabeledTextField: View {
    let label: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default

    init(_ label: String, text: Binding<String>, keyboardType: UIKeyboardType = .default) {
        self.label = label
        self._text = text
        self.keyboardType = keyboardType
    }

    var body: some View {
        TextField(label, text: $text)
            .keyboardType(keyboardType)
            .autocorrectionDisabled(keyboardType != .default)
            .textInputAutocapitalization(keyboardType == .default ? .words : .never)
    }
}
