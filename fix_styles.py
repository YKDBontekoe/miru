with open("frontend/src/components/productivity/ProductivityHeader.tsx", "r") as f:
    content = f.read()
content = content.replace("              styles.iconButton,\n", '              className="w-10 h-10 rounded-full items-center justify-center",\n')
with open("frontend/src/components/productivity/ProductivityHeader.tsx", "w") as f:
    f.write(content)

with open("frontend/src/components/productivity/ProductivityTabs.tsx", "r") as f:
    content = f.read()
content = content.replace("              styles.tabButtonActive,", "")
content = content.replace("              styles.tabTextActive,", "")
with open("frontend/src/components/productivity/ProductivityTabs.tsx", "w") as f:
    f.write(content)
