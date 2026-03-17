import re

with open("frontend/lib/features/chat/pages/chat_page.dart", "r") as f:
    text = f.read()

# Remove _signalRSubscription?.cancel() from _stopGeneration
text = text.replace("    _activeStreamSubscription?.cancel();\n    _signalRSubscription?.cancel();", "    _activeStreamSubscription?.cancel();")

# Remove MessageStatus.sent update from onDone
on_done_orig = """      onDone: () {
        if (!mounted) return;
        setState(() {
          _streamingStatus = null;
          final lastIndex = _messages.length - 1;
          if (_messages[lastIndex].status == MessageStatus.streaming) {
            _messages[lastIndex] = _messages[lastIndex].copyWith(
              status: MessageStatus.sent,
            );
          }
        });
        HapticFeedback.mediumImpact();
      },"""

on_done_new = """      onDone: () {
        if (!mounted) return;
        setState(() {
          _streamingStatus = null;
        });
        HapticFeedback.mediumImpact();
      },"""

text = text.replace(on_done_orig, on_done_new)

# Map raw error exceptions to user-friendly messages
error_catch_orig = """      // Don't overwrite if already cancelled.
      if (_messages.isNotEmpty) {
        setState(() {
          final lastIndex = _messages.length - 1;
          if (_messages[lastIndex].status != MessageStatus.sent) {
            _messages[lastIndex] = _messages[lastIndex].copyWith(
              text: _messages[lastIndex].text.isEmpty
                  ? 'Error: $e'
                  : _messages[lastIndex].text,
              status: MessageStatus.failed,
            );
          }
        });
      }"""

error_catch_new = """      // Don't overwrite if already cancelled.
      if (_messages.isNotEmpty) {
        setState(() {
          final lastIndex = _messages.length - 1;
          if (_messages[lastIndex].status != MessageStatus.sent) {
            _messages[lastIndex] = _messages[lastIndex].copyWith(
              text: _messages[lastIndex].text.isEmpty
                  ? 'Something went wrong. Please try again.'
                  : _messages[lastIndex].text,
              status: MessageStatus.failed,
            );
          }
        });
      }"""

text = text.replace(error_catch_orig, error_catch_new)

with open("frontend/lib/features/chat/pages/chat_page.dart", "w") as f:
    f.write(text)
