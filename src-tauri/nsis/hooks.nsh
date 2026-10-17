; AstraIDE NSIS Custom Hooks
; Automatically adds AstraIDE to Windows PATH and creates Desktop shortcuts for any user / all users

!include "LogicLib.nsh"
!include "WinMessages.nsh"

!macro NSIS_HOOK_POSTINSTALL
  DetailPrint "Configuring AstraIDE Environment and PATH..."

  ; Always add to Current User PATH
  ReadRegStr $0 HKCU "Environment" "PATH"
  ${If} $0 == ""
    WriteRegExpandStr HKCU "Environment" "PATH" "$INSTDIR"
  ${Else}
    Push "$0"
    Push "$INSTDIR"
    Call StrContainsHook
    Pop $1
    ${If} $1 == "0"
      WriteRegExpandStr HKCU "Environment" "PATH" "$0;$INSTDIR"
    ${EndIf}
  ${EndIf}

  ; Create Desktop Shortcut for current user / all users
  SetShellVarContext current
  CreateShortCut "$DESKTOP\AstraIDE.lnk" "$INSTDIR\AstraIDE.exe" "" "$INSTDIR\AstraIDE.exe" 0

  ; Broadcast environment changes so all open terminals and processes pick it up
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DetailPrint "Cleaning AstraIDE shortcuts and environment..."
  SetShellVarContext current
  Delete "$DESKTOP\AstraIDE.lnk"

  ; Notify Windows of environment updates
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

; Substring search helper for NSIS
!ifndef StrContainsHook_Defined
!define StrContainsHook_Defined
Function StrContainsHook
  Exch $R0 ; needle
  Exch
  Exch $R1 ; haystack
  Push $R2
  Push $R3
  Push $R4

  StrCpy $R2 0
  StrLen $R3 $R0
  StrLen $R4 $R1

  StrContainsHook_loop:
    StrCpy $0 $R1 $R3 $R2
    StrCmp $0 $R0 StrContainsHook_found
    IntOp $R2 $R2 + 1
    IntCmp $R2 $R4 StrContainsHook_notfound StrContainsHook_notfound StrContainsHook_loop

  StrContainsHook_found:
    StrCpy $R0 "1"
    Goto StrContainsHook_done
  StrContainsHook_notfound:
    StrCpy $R0 "0"
  StrContainsHook_done:
    Pop $R4
    Pop $R3
    Pop $R2
    Pop $R1
    Exch $R0
FunctionEnd
!endif
