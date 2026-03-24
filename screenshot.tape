Output assets/screenshot.gif

Set Theme "Catppuccin Mocha"
Set FontSize 14
Set Width 1000
Set Height 560
Set Padding 16
Set WindowBar Colorful
Set WindowBarSize 36
Set BorderRadius 8
Set TypingSpeed 40ms
Set Framerate 24

Type "npm start -- /tmp/demo-repos"
Enter

# Wait for scan to complete and list to populate
Sleep 4s

# Appreciate the full list
Sleep 2s

# Select item 1 (my-app/node_modules — largest, already at cursor)
Space
Sleep 1.2s

# Move to item 3 (api-server/node_modules) and select it
Down
Sleep 200ms
Down
Sleep 200ms
Space
Sleep 1.2s

# Move to item 5 (landing-page/node_modules) and select it
Down
Sleep 200ms
Down
Sleep 200ms
Space
Sleep 1.5s

# Open deletion confirmation
Type "d"
Sleep 3s

# Confirm deletion
Type "y"
Sleep 3.5s

# Summary shown — return to list
Type "r"
Sleep 3s
