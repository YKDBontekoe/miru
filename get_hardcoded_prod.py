import re

with open("frontend/app/(main)/productivity.tsx", "r") as f:
    content = f.read()

# Finding Alert.alert occurrences
alerts = re.findall(r"Alert\.alert\((.*?)\)", content)
for a in alerts:
    print("Alert:", a)
