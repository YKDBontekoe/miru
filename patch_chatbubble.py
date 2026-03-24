with open('frontend/src/components/ChatBubble.tsx', 'r') as f:
    content = f.read()

import re

# We refactor the inline style objects into tailwind classes inside ChatBubble
content = content.replace(
    "<View style={{ alignItems: 'flex-end', marginBottom: 12, marginStart: 56 }}>",
    "<View className=\"items-end mb-3 ms-14\">"
)
content = content.replace(
    """        <View
          style={{
            backgroundColor: C.userBubble,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 18,
            borderBottomRightRadius: 4,
            maxWidth: '100%',
          }}
        >""",
    """        <View className=\"bg-blue-600 px-3.5 py-2.5 rounded-2xl rounded-br-[4px] max-w-full\">"""
)
content = content.replace(
    "<AppText style={{ color: C.userText, fontSize: 16, lineHeight: 22 }}>{text}</AppText>",
    "<AppText className=\"text-white text-base leading-[22px]\">{text}</AppText>"
)
content = content.replace(
    "<AppText style={{ color: C.faint, fontSize: 10, marginTop: 3, marginEnd: 2 }}>",
    "<AppText className=\"text-[#B0B0C0] text-[10px] mt-[3px] me-0.5\">"
)

content = content.replace(
    "<View style={{ alignItems: 'flex-start', marginBottom: 12, marginEnd: 56 }}>",
    "<View className=\"items-start mb-3 me-14\">"
)
content = content.replace(
    "<View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>",
    "<View className=\"flex-row items-end\">"
)
content = content.replace(
    """        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: isFailed ? C.errorBubble : `${accentColor}18`,
            borderWidth: 1,
            borderColor: isFailed ? C.errorBubbleBorder : `${accentColor}35`,
            alignItems: 'center',
            justifyContent: 'center',
            marginEnd: 8,
            marginBottom: 2,
            flexShrink: 0,
          }}
        >""",
    """        <View
          className={`w-7 h-7 rounded-full border items-center justify-center me-2 mb-0.5 shrink-0 ${isFailed ? 'bg-red-50 border-red-200' : ''}`}
          style={!isFailed ? { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}35` } : {}}
        >"""
)
content = content.replace(
    """          <AppText
            style={{ color: isFailed ? C.errorText : accentColor, fontSize: 10, fontWeight: '700' }}
          >""",
    """          <AppText
            className={`text-[10px] font-bold ${isFailed ? 'text-red-600' : ''}`}
            style={!isFailed ? { color: accentColor } : {}}
          >"""
)
content = content.replace(
    "<View style={{ flex: 1 }}>",
    "<View className=\"flex-1\">"
)
content = content.replace(
    """            <AppText
              style={{ color: accentColor, fontSize: 12, fontWeight: '600', marginBottom: 3 }}
            >""",
    """            <AppText
              className=\"text-xs font-semibold mb-[3px]\"
              style={{ color: accentColor }}
            >"""
)

content = content.replace(
    """          <View
            style={{
              backgroundColor: isFailed ? C.errorBubble : C.agentBubble,
              borderWidth: 1,
              borderColor: isFailed ? C.errorBubbleBorder : C.agentBubbleBorder,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 18,
              borderBottomLeftRadius: 4,
            }}
          >""",
    """          <View
            className={`border px-3.5 py-2.5 rounded-2xl rounded-bl-[4px] ${isFailed ? 'bg-red-50 border-red-200' : 'bg-[#F0F0F6] border-[#E0E0EC]'}`}
          >"""
)

content = content.replace(
    "<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>",
    "<View className=\"flex-row items-center mt-1 gap-2\">"
)
content = content.replace(
    "<AppText style={{ color: C.errorText, fontSize: 12 }}>",
    "<AppText className=\"text-red-600 text-xs\">"
)
content = content.replace(
    """                <TouchableOpacity
                  onPress={onRetry}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                >""",
    """                <TouchableOpacity
                  onPress={onRetry}
                  className=\"flex-row items-center gap-[3px]\"
                >"""
)
content = content.replace(
    "<AppText style={{ color: C.userBubble, fontSize: 12, fontWeight: '600' }}>",
    "<AppText className=\"text-blue-600 text-xs font-semibold\">"
)
content = content.replace(
    "<AppText style={{ color: C.faint, fontSize: 10, marginTop: 3, marginStart: 36 }}>",
    "<AppText className=\"text-[#B0B0C0] text-[10px] mt-[3px] ms-9\">"
)

with open('frontend/src/components/ChatBubble.tsx', 'w') as f:
    f.write(content)
