sed -i 's/onPress={onContextPress!}/onPress={onContextPress ?? (() => {})}/g' frontend/src/components/chat/RoomPromptRail.tsx
sed -i 's/const keyExtractorContext = (item: string) => item;/const keyExtractorContext = (item: string, index: number) => `${item}-${index}`;/g' frontend/src/components/chat/RoomPromptRail.tsx
