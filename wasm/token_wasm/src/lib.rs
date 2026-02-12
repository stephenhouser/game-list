use wasm_bindgen::prelude::*;
use base64::engine::general_purpose::STANDARD;
use base64::Engine as _;

#[wasm_bindgen]
pub fn get_token() -> String {
    let a = "NmVhMWZkNDEtOWI0ZC0";
    let b = "0MDVhLWE3MTAtNGNiNWE1MTdhNmV";
    let s = format!("{}{}h", a, b);
    let decoded = STANDARD.decode(s).expect("base64 decode failed");
    String::from_utf8(decoded).expect("utf8 conversion failed")
}
