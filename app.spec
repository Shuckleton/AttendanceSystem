# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['C:/xampp/htdocs/AttendanceSystem-master/app.py'],
    pathex=[],
    binaries=[],
    datas=[('C:\\xampp\\htdocs\\AttendanceSystem-master\\static', 'static'), ('C:\\xampp\\htdocs\\AttendanceSystem-master\\templates', 'templates'), ('C:\\xampp\\htdocs\\AttendanceSystem-master\\tmp', 'tmp'), ('C:\\xampp\\htdocs\\AttendanceSystem-master\\node_modules', 'node_modules')],
    hiddenimports=['flask_socketio', 'engineio', 'socketio', 'gevent', 'gevent.monkey', 'gevent.queue'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='app',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['C:\\xampp\\htdocs\\AttendanceSystem-master\\warning_xm0_icon.ico'],
)
