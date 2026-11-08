#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Pencereyi bir kez oluştur; WebView2 indirmelerini yerel hedefe bırak.
            tauri::WebviewWindowBuilder::from_config(app, &app.config().app.windows[0])?
                .on_download(|_webview, _event| true)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("GraphCalc başlatılamadı");
}
