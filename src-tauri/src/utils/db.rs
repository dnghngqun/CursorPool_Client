use rusqlite::{Connection, Result};
use std::collections::HashMap;
use std::path::Path;

pub fn update_sqlite_db(db_path: &Path, data: &HashMap<String, String>) -> Result<(), String> {
    let mut conn = Connection::open(db_path).map_err(|e| format!("无法Mở cơ sở dữ liệu: {}", e))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS ItemTable (key TEXT PRIMARY KEY, value TEXT)",
        [],
    )
    .map_err(|e| format!("Tạo bảng失败: {}", e))?;

    let tx = conn
        .transaction()
        .map_err(|e| format!("创建事务失败: {}", e))?;

    for (key, value) in data {
        tx.execute(
            "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?1, ?2)",
            [key, value],
        )
        .map_err(|e| format!("Chèn dữ liệu失败: {}", e))?;
    }

    tx.commit().map_err(|e| format!("Commit giao dịch失败: {}", e))?;
    Ok(())
}
