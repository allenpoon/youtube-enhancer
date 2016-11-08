# youtube-enhancer

## Chrome Extension only

## Feature
1. Auto HD: switch to Highest resolution automatically
2. Custom range loop/crop: detail see [Input format](#input-format)
3. Auto save video setting
4. Auto loop/crop if it set to loop in that video last time
5. A-B Range setup button
6. Auto update timer if video event is triggered
7. Support changing playback rate

## Build

1. Clone this repository
2. Update src/*
3. Use bash in *nix or Ubuntu on Windows 10
  - ```bash translate.sh```

## Install

### From source

1. Download and extract from [lastest release](../../releases/latest)
2. Go to chrome://extensions/
3. Enable Developer mode
4. Load unpacked extension...
5. Select extracted directory

### From Chrome extension store

Not yet available

## Input format
- (empty)
  - 00:00:00.000 / \<end of video>
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
  - 25:00:00.000

## TODO
- Save playback rate
- Reset playback rate when the video is changed
- UI Text customization
