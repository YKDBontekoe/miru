# Miru Frontend

The Flutter frontend for Miru — a personal AI assistant that remembers you.

## Architecture

The project follows a **feature-first** directory structure for scalability and maintainability.

- `lib/core/`: Common logic, design system, shared models, and global services.
  - `api/`: Networking layer (using Dio).
  - `design_system/`: Atomic UI components, tokens, and themes.
  - `models/`: Shared data models (using Freezed).
  - `services/`: Global infrastructure services (Supabase, Passkey).
- `lib/features/`: Feature-specific logic, pages, and widgets.
  - `auth/`: Authentication flow.
  - `chat/`: Main AI chat interface.
  - `agents/`: Custom AI persona management.
  - `rooms/`: Multi-agent chat rooms.
  - `settings/`: App configuration.
  - `onboarding/`: First-launch experience.

## Key Technologies

- **State Management:** [Riverpod](https://riverpod.dev/) for decoupled logic and DI.
- **Networking:** [Dio](https://pub.dev/packages/dio) with interceptors and streaming support.
- **Data Modeling:** [Freezed](https://pub.dev/packages/freezed) & [JSON Serializable](https://pub.dev/packages/json_serializable) for immutable models and boilerplate-free serialization.
- **Backend/Auth:** [Supabase](https://supabase.com/) for authentication and real-time features.
- **Design:** Custom Design System with light/dark theme support.

## Getting Started

1.  **Install dependencies:**
    ```bash
    flutter pub get
    ```

2.  **Generate models:**
    This project uses code generation for models and providers.
    ```bash
    dart run build_runner build --delete-conflicting-outputs
    ```

3.  **Run the app:**
    ```bash
    flutter run
    ```

## Testing

- **Unit/Widget Tests:** `flutter test`
- **Integration Tests:** `flutter test integration_test/smoke_test.dart`
