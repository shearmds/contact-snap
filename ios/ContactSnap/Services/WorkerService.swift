import UIKit

enum WorkerError: LocalizedError {
    case networkError(Error)
    case serverError(String)
    case parseError

    var errorDescription: String? {
        switch self {
        case .networkError(let e): return "Network error: \(e.localizedDescription)"
        case .serverError(let msg): return "Server error: \(msg)"
        case .parseError: return "Could not parse the response from the server."
        }
    }
}

private func extractJSON(from text: String) -> String {
    guard let start = text.firstIndex(of: "{"),
          let end = text.lastIndex(of: "}") else { return text }
    return String(text[start...end])
}

struct WorkerService {
    static let workerURL = URL(string: "https://contact-snap.shearm.workers.dev")!

    static func extractContact(from image: UIImage) async throws -> ContactInfo {
        guard let jpeg = image.jpegData(compressionQuality: 0.85) else {
            throw WorkerError.parseError
        }
        let base64 = jpeg.base64EncodedString()

        let payload: [String: String] = ["imageBase64": base64, "mimeType": "image/jpeg"]
        var request = URLRequest(url: workerURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse else { throw WorkerError.parseError }

        struct WorkerResponse: Decodable {
            let text: String?
            let error: String?
        }

        let workerResponse = try JSONDecoder().decode(WorkerResponse.self, from: data)

        if http.statusCode != 200 {
            throw WorkerError.serverError(workerResponse.error ?? "HTTP \(http.statusCode)")
        }

        guard let text = workerResponse.text else { throw WorkerError.parseError }

        // Gemini occasionally wraps output in markdown fences despite the prompt.
        // Extract the first JSON object we find to handle both clean and fenced responses.
        let json = extractJSON(from: text)
        guard let jsonData = json.data(using: .utf8) else { throw WorkerError.parseError }

        do {
            return try JSONDecoder().decode(ContactInfo.self, from: jsonData)
        } catch {
            throw WorkerError.parseError
        }
    }
}
