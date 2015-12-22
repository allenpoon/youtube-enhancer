# youtube-replayer

## Chrome Extension only

## Feature
1. Auto HD: switch to Highest resolution automatically
2. Custom range loop: detail see [Input format](#Input-format)
3. Auto save range
4. Auto loop if it set to loop in that video last time

## Install
1. Go to chrome://extensions/
2. Enable Developer mode
3. Load unpacked extension...
4. Select this Directory

## Input format
- (empty)
  - 00:00:00.000
- 1
  - 00:00:00.100
- 12
  - 00:00:00.120
- 01
  - 00:00:00.010
- 1000
  - 00:00:01.000
- 1some non-digital string1
  - 00:00:01.100
- 61.0
  - 00:01:01.000
- 1.60.1.1
  - 02:00:01.100
- 25.0.0.0
  - 25:00:01.000