import SwiftUI
import PhotosUI

struct ContentView: View {
    @State private var showCamera = false
    @State private var showPhotoPicker = false
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var isProcessing = false
    @State private var extractedContact: ContactInfo?
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 32) {
                Spacer()

                Image(systemName: "person.crop.rectangle")
                    .font(.system(size: 80))
                    .foregroundStyle(.tint)

                Text("Snap2Contact")
                    .font(.largeTitle.bold())

                Text("Photograph a business card to instantly save the contact.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                Spacer()

                VStack(spacing: 12) {
                    Button {
                        showCamera = true
                    } label: {
                        Label("Take Photo", systemImage: "camera.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)

                    PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                        Label("Choose from Library", systemImage: "photo.on.rectangle")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 48)
            }
            .overlay {
                if isProcessing {
                    ProcessingOverlay()
                }
            }
            .sheet(isPresented: $showCamera) {
                CameraView { image in
                    showCamera = false
                    processImage(image)
                }
                .ignoresSafeArea()
            }
            .navigationDestination(item: $extractedContact) { contact in
                ContactEditView(contact: contact)
            }
            .alert("Error", isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )) {
                Button("OK", role: .cancel) { errorMessage = nil }
            } message: {
                Text(errorMessage ?? "")
            }
        }
        .onChange(of: selectedPhotoItem) { _, item in
            guard let item else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    processImage(image)
                }
                selectedPhotoItem = nil
            }
        }
    }

    private func processImage(_ image: UIImage) {
        isProcessing = true
        Task {
            defer { isProcessing = false }
            do {
                let contact = try await WorkerService.extractContact(from: image)
                extractedContact = contact
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

struct ProcessingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.4).ignoresSafeArea()
            VStack(spacing: 16) {
                ProgressView()
                    .controlSize(.large)
                    .tint(.white)
                Text("Extracting contact info…")
                    .foregroundStyle(.white)
                    .font(.callout)
            }
            .padding(32)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
        }
    }
}
