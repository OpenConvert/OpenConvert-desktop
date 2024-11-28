!include "MUI.nsh"
!include "WinMessages.nsh"
!include "LogicLib.nsh"
!define Name "openconvert"
!define VERSION "0.1.0"
!define MUI_ICON "..\..\icons\logo.ico"
InstallDir "$PROGRAMFILES\OpenConvert"
OutFile "openconvert-web-installer.exe"
RequestExecutionLevel admin

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "../../LICENSE"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_FINISHPAGE_TEXT_REBOOTNOW "Reboot now"
!insertmacro MUI_FINISHPAGE_SHOWREADME "Reboot now"
Section "Main program" main
    CreateDirectory "$INSTDIR\bin"
    AddSize 315392
    SetOutPath $INSTDIR
    WriteUninstaller "$INSTDIR\Uninstall.exe"
    inetc::get /caption "Main program" /popup "" "https://github.com/OpenConvert/OpenConvert-desktop/releases/download/0.1.0/openconvert-0.1.0-x64.nsis.7z" "$INSTDIR\win.7z" /end ;edit https-link to file url
    Nsis7z::ExtractWithDetails "$INSTDIR\win.7z" "Extracking archives %s..."
    Delete "$INSTDIR\win.7z"
    Pop $0 
    MessageBox MB_OK "status: $0"
    nsExec::ExecToStack 'setx PATH "$INSTDIR\bin"'
    SetRebootFlag true
SectionEnd

Section "Desktop Shortcut" DeskShort
    CreateShortCut "$DESKTOP\${Name}.lnk" "$INSTDIR\${Name}.exe"
SectionEnd

SectionGroup "Converters" converters
    Section "Audio and video" ffmpeg
        AddSize 128165
        SetOutPath "$INSTDIR\bin"
        inetc::get /caption "ffmpeg" /popup "" "https://github.com/OpenConvert/website/releases/download/0.0.0/ffmpeg.7z" "$INSTDIR\ffmpeg.7z" /end ;edit https-link to file url
        Nsis7z::ExtractWithDetails "$INSTDIR\ffmpeg.7z" "Extracking archives %s..."
        Delete "$INSTDIR\ffmpeg.7z"
        Pop $1 
        MessageBox MB_OK "status: $1"
        
    SectionEnd
    Section "Image" libvips
        AddSize 417792
        SetOutPath "$INSTDIR\bin"
        inetc::get /caption "libvips" /popup "" "https://github.com/OpenConvert/website/releases/download/0.0.0/libvips.7z" "$INSTDIR\libvips.7z" /end ;edit https-link to file url
        Nsis7z::ExtractWithDetails "$INSTDIR\libvips.7z" "Extracking archives %s..."
        Delete "$INSTDIR\libvips.7z"
        Pop $2 
        MessageBox MB_OK "status: $2"
    SectionEnd 
SectionGroupEnd

Function .onInit
    ; Force the selection of the "main" section and make it read-only
    SectionGetFlags ${main} $0
    IntOp $0 $0 | ${SF_SELECTED}
    IntOp $0 $0 | ${SF_RO}
    SectionSetFlags ${main} $0
FunctionEnd

Section "Uninstall"
    ; Remove registry entries
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${Name}"
    ; Remove installed files
    
    RMDir /r "$INSTDIR"
    ; Remove desktop shortcut
    Delete "$DESKTOP\${Name}.lnk"
SectionEnd

Function un.onInit
    MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "Are you sure you want to uninstall ${Name}?" IDYES +2
    Abort
FunctionEnd