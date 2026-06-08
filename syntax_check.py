import sys

content = open('main.js').read()
stack = []
for i, char in enumerate(content):
    if char == '{':
        stack.append(i)
    elif char == '}':
        if not stack:
            print(f"Extra '}}' found near character {i}")
            sys.exit(1)
        stack.pop()

if stack:
    print(f"Unclosed '{{' found near character {stack[-1]}")
    sys.exit(1)

print("Braces match!")
