with open("frontend/src/components/productivity/ProductivityHeader.tsx", "r") as f:
    content = f.read()
content = content.replace('              className="w-10 h-10 rounded-full items-center justify-center",\n', "")
content = content.replace("style={({ pressed }) => [\n", 'className="w-10 h-10 rounded-full items-center justify-center"\n            style={({ pressed }) => [\n')
with open("frontend/src/components/productivity/ProductivityHeader.tsx", "w") as f:
    f.write(content)

with open("frontend/src/components/productivity/ProductivityTabs.tsx", "r") as f:
    content = f.read()
content = content.replace("              styles.tabButton,\n", "")
content = content.replace("                styles.tabText,\n", "")
with open("frontend/src/components/productivity/ProductivityTabs.tsx", "w") as f:
    f.write(content)
