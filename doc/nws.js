function $id(id) { return document.getElementById(id); }
var UI = {
  chkmsgfr:'Verifiez que la calculatrice Numworks est connectee.\nCliquez sur le bouton Detecter puis reessayez.',
  chkmsgen:'Check that the Numworks calculator is connected.\nClick on the detect button and try again.',
  xcasfrmsg:"Les liens Test ci-dessus chargent vos scripts dans MicroPython de Xcas. Vous pouvez ensuite les &eacute;diter, les envoyer par email, les poster sur des forums (par exemple <a href=\"https://xcas.univ-grenoble-alpes.fr/forum/\">le forum de Xcas</a>) ou les renvoyer vers la Numworks (icones enveloppe, boutons F et Numworks→ en haut). Pour visualiser un graphique Kandinsky, matplotlib ou tortue validez ; ou , ou . dans une ligne de commande vide.",
  xcasenmsg:"The Test link above will load your scripts into Xcas's Micropython. From there you can edit, execute, send them by mail, post them on a forum (for eaemple <a href=\"https://xcas.univ-grenoble-alpes.fr/forum/\">Xcas forum</a>) and send them back to the Numworks (from the toolbar at the top, mail icon, F and  Numworks→ buttons). If you want to see a Kandinsky, matplotlib or turtle graph, enter ; or , or . on an empty commandline and hit Enter",
  nws_progress:0,
  nws_progresslegend:0,
  Datestart:Date.now(),
  langue: -1, // -1 french
  calc: 2, // 1 KhiCAS, 2 Numworks, 3 TI Nspire CX
  calculator:0, // !=0 if hardware Numworks connected
  appsaddress:0x90200000,
  calculator_connected:false,
  tar_first_modif_offset:0,
  current_interface:0,
  nws_connect:function(intf=0){
    UI.current_interface=intf;
    UI.nws_progress=$id('plog');
    UI.nws_progresslegend=$id('ploglegend');
    if (navigator.usb){
      //console.log('nws_connect 0');
      UI.calculator=0;
      UI.calculator_connected=false;
      //console.log('nws_connect 1');
      function autoConnectHandler(e) {
	UI.calculator.stopAutoConnect();
	console.log('connected');
	UI.calculator_connected=true;
      }
      UI.calculator= new Numworks();
      console.log('nws_connect',UI.calculator);
      navigator.usb.addEventListener("disconnect", function(e) {
	if (UI.calculator==0) return;
	UI.calculator.onUnexpectedDisconnect(e, function() {
	  UI.calculator_connected=false;
          UI.calculator=0;
	});
      });
      //console.log('nws_connect 2');
      UI.calculator.autoConnect(autoConnectHandler);
      return UI.calculator;
      //console.log('nws_connect 3');
    }
  },
  nws_detect_success:function(){
    alert('Success');
  },
  nws_detect_failure:function(error){
    console.log(error);
    alert(UI.langue==-1?'Verifiez la connexion de la calculatrice et reessayez':'Check calculator connection and try again');
  },
  nws_detect:async function(success,failure){
    UI.calculator= new Numworks();
    UI.calculator.detect(success,failure);
  },
  nws_rescue_connect:async function(){
    if (navigator.usb){
      //console.log('nws_rescue_connect 0');
      UI.calculator=0;
      UI.calculator_connected=false;      //console.log('nws_rescue_connect 1');
      function autoConnectHandler(e) {
	UI.calculator.stopAutoConnect();
	console.log('rescue connected');
	UI.calculator_connected=true;
      }
      UI.calculator= new Numworks.Recovery();
      console.log('nws_rescue_connect',UI.calculator);
      navigator.usb.addEventListener("rescue disconnect", function(e) {
	if (UI.calculator==0) return;
	UI.calculator.onUnexpectedDisconnect(e, function() {
	  UI.calculator_connected=false;
          UI.calculator=0;
	});
      });
      //console.log('nws_rescue_connect 2');
      if (await UI.calculator.autoConnect(autoConnectHandler)==-1){
	return -1;
      }
      //console.log('nws_rescue_connect 3');
      return 0;
    }
  },
  b64_main : "/7V9SADwuPgAJ3xMoEd6SADwsvhP8AAAeUlB8qUCeUuYR0DyHWBP8LIBT/DPAnZLT/AKBADwAfhA4CC1c02t6wUNAJABlAKocUygR29NDesFDSC9/7VvSkjyz1RP8AEDEWhB6gQBAPAa+AP6APCB6gABEWD/vf61Z0pP8AEDEWgA8Aj4A/oA8AHqAAEAKQi/ASD+vQK1D/JNEQhcAr0CtU6hCFwCvQC1//fU/0/wZAAA8Fb4CEb/997/AL1P8AEAT/AAAf/37/8BKAi/U0gIvwDwUvhISADwT/hP8AEAT/ABAf/34P8BKAi/TUgIvwDwQ/gIvwDwKfhP8AEAT/ACAf/30f8BKAi/RkgIv4BHCL8A8Bv4T/ACAE/wAAH/98P/ASgIvz1ICL8A8Cb4CL8A8Az4T/ACAE/wAQH/97T/ASgIvwDwI/i55/C9/ucDtTZJT/AAAAhgA70CtTRJCGACvQK1T/CUAQD7AfAAv6DxAQAAKIi/+ecCvf/36P8BRghogPMIiAHxBAEIaABHH7VA8gRAT/SIcU/wjAIlS0/wUAT/90v/T/AIAE/wBQH/93v/ASgYv/bnT/AAABFJQfKlAhBLmEdA8h1gT/CyAU/wzwINS0/wCgT/9zD/H70PCggHBgMCAAEBCQsEBQYUAAJYz4UAABAIAlgAIAAAkM1aAAhAAfAAkQMACMDAAAi49QEA5TcACBQAAlgQCAJYAJjwHyAAQJDZgQAIlO0A4AjtAOAwxwAI",
  b64_main115 : "/7V6SADwuPgAJ3lMoEd3SADwsvhP8AAAdklB8qUCdkuYR0DyHWBP8LIBT/DPAnNLT/AKBADwAfhA4CC1cE2t6wUNAJABlAKobkygR2xNDesFDSC9/7VsSkDy/xRP8AEDEWhB6gQBAPAa+AP6APCB6gABEWD/vf61ZEpP8AEDEWgA8Aj4A/oA8AHqAAEAKQi/ASD+vQK1D/JNEQhcAr0CtU6hCFwCvQC1//fU/0/wZAAA8Fb4CEb/997/AL1P8AEAT/AAAf/37/8BKAi/UEgIvwDwUvhFSADwT/hP8AEAT/ABAf/34P8BKAi/SkgIvwDwQ/gIvwDwKfhP8AEAT/ACAf/30f8BKAi/Q0gIv4BHCL8A8Bv4T/ACAE/wAAH/98P/ASgIvzpICL8A8Cb4CL8A8Az4T/ACAE/wAQH/97T/ASgIvwDwI/i55/C9/ucDtTNJT/AAAAhgA70CtTFJCGACvQK1T/CUAQD7AfAAv6DxAQAAKIi/+ecCvf/36P8BRghogPMIiAHxBAEIaABHH7VA8gRAT/SIcU/wjAIiS0/wUAT/90v/T/AIAE/wBQH/93v/ASgYv/bnT/AAAA5JQfKlAg1LmEdA8h1gT/CyAU/wzwIKS0/wCgT/9zD/H70IBwYFBAMCAAEAAQIDBAUAIAAAkG0OIABAAfAAIQYgAMDAIAC49QEAUVEgABQAAEIQCAJCAADwHyAAQJDZgQAIlO0A4AjtAOAwxyAA",
  b64_image : "L6UQAgDDLz3/2gDFD2IBdy89/2YB/g/IAv+hD5ADuQ+6Av4P9gR4Lz3/HgT+D2YBPg9kAf8gD2gBHy89/0oI/g9mATwPEAFBD2QB9yw9/wIAD4QAOw9oAcMP3gAhD14BRQ5sAQ9mAesOggAPyAL+D2QBeQ8+D9AORgIPZAH/dA+iEP4PZAFaLz3/ZAH/EC89/2QB/0APNAk5DxwIyw9kAXMP+BX+D2QB/1cPYA3ND2QB/9QPKBDPD2IB/+YvPf8eEx0PAgBLKhnlAgAPYgGxD2QBAS8Z5SIBJQ96ABUvGeUCABcPYgHBABYAL3BKAgAjD3wAAS9wSgIAKQ5mAQ9eEYEPegIdBmQBDnIADzoBDQxaAA6wAQ9kAacPKhQDD9wDJw9kAf4PqAYmD0gABw4yAQ86ARsOYAEPZAH//g9mATcPRgAJDjIBDjoBD/QG3Q5oAQ9gASMPZAH/FA/qBiUPZAEJDyQEFw9uAAEOrgEPZAGvDxALHQ9kAf4PuBtQDiwECFgrD/YDJw9GACMPUA+dD2QB/4YIEgAPtAkTD2ABCQ9kAf//ZQ9MDxsODAQOYAEEMgEPZAH//10PZAsJDgwED2gSDQwQFg9kAekA1gAPZAH/WA+QFxcIDAQIsgwO+iUKHAAPZAH//2sMWAEMDAQMNAQOIhUOaAEPZAH//18P6jABD8QeLQ9kAf//////Kg+ICQkPVCQtD2QB//9XDoQJD2QBKwy2RA9kAf//bwxQDA92PhUOiAwPZAH//3kOzAYP6AkLDJwBD2QB//9vDvwGDhgADkQvDjAED2QB/xYKehMPZAH/PAQoAQxkAQ4YBw7OTw9kAf8eD3wIGQ9kAf0PaAEZD4InEQ4QAA9kAf//WQ7WIg9gOR8OWAQOvAkPZAH//zsPCDo5DigAD3IAHQ9cAecPZAFXD24BuS8Z5QIAiw/MAusPYgH+DwIA////////////////////////////////////////cg4oJQ9gAf9ED2gB/0YP+CcdD3pzOQ/efikP9C0ND6wAGQ/IWQ0PqCsZD2IBCw6eVQ9kAf+CDgwADoQAD6QtDQ/kAA0PTAAJDyAuFQ+8AA0PnAAhDyQABQ5yWA4wBA9kAf9+Dmw7Dng7DxQADQ9kARUPADwND+wwHQ+cAC0PKAADDj5bDtBVD2QB/1wPdGURDrQAD8gANw8IAA0PAAchDkwAD5wAHw4YAQ9kAf+MDvQGD2QB8w/0BhcOZAEOWAgPZAH/dA6oCQ+8CRMPaAEdD8ABGQ+cByEPnAAVD9QBEw6iWA6AWw9kAf94DxQS/1IP3BT//g+kF/4P/B//////////////vg9iAf8ODqZqD/wf/g/0ACgPZAH/UA94eAUP/B//RA9kAf9GD0B7Bw/8H/4PLAQmD2QB/2AOKiQP/B/+DywELg9kAf9ELqUQWiEP/B/+D2QB/5IP/B//Mw7oDQ9kAf9hD/wf////////////////////nw5gGw+cHksPjsCLD2QB/1APmB5FD6AeIQ8cIR0PUB4dDuyoD2QB/7YP0BsbD5geLQ9gGA0OQKAPpB4fD0AkLQ9kAf+yDmAhD5geJw4sBA6AIQ+MGyUPJBwlDmgBD2QB/7YP9AZXDkABD4ApKw9QHiUPWAjJD2QB6Q+EDD0PLAQZDjgED1QeFw9QHh0OCLQPZAH/vg/8H////////////////////04OADkPmB6CDzgTKg4YGQ/i4FUPZAH/UA/+WDcPmB5TDpATD/g+Iw80Px0PwD4ZDiSYD2QB/04OYAEPmB6RDvg+D3w5Mw8AFyEPqBYPD2QB/2AODBkPmB5/DlABD2QBQw9QARkP8AQLD2QB/1IPWmEPD5gefQ9kAVEPSD8pD2QB/2YOhAwPmB6TD/g+LQ+8CRUP7AQRDoxFD2QB/2EP+D////////////////////+TDsAPD2QfXQ9kAf/oDzhWWQ88MxkOKDMPZAH//g/QGw8PxHs9D6ReQQ9kAf/+D5Q+PQ/QHRUPZAH//g+UPoUPZAH//g+UPqUPgMIVDzAnIA9kAf//Bg/8H////////////6dQEKUQpRA=",
  b64_about : "L6UQAgD/////////////////////////////////////////////////////////////////////////qiY9/wIAD4gAbQ88ADEPSAA1DzgAKQ+QAA0OcAEPIAL//6UOpAAOwAAMRAIOUAIPIAAPDhQBD4wAJw+gAAkOnAEPiAAbDzwACQ5gAA8gAg8OgAAOzAIPIAL//7MPNAEFD3QBBQ8gAB0PCAIZD2wAIQ+UABkPDAIJDlAADiQBD2AGLQ8gAv//ww8wASEPIAIdDwgLDQ8MAj0P3AApDigHDswBDyAC////CA8AAiEPIAAlDyACXQ8UACEPzAEVDjwADyAC///RDhgKD2AGaw6QDg+kDhcP4A4dD5wADQ8sCwkPpA8ZD5gAFQ8gAv//pg8aM/////////////////////////////////+tDk4aD/Yknw+uMZUPIAL//7sPrh4lD84wGQ9WHxUMfAAPEjERD0YoGQ/SHw0P/jAZD+AAFQ8gAv//zw82IxkPTihZD3wCEQ6GLA8WKScPlAAdDwwBGQ8gAv/+D7o/tQ9KOBUPjigBD84wVQ92LVEPrAYVDmAHD+YsHw8gAv//mw+gCikPQjkhD6ACDQ8gAr0PIAEtDyAC///TD+AOJQ84DhUPSAINDzY6SQ9ABhkOBjUPWAsfDyAC//+/DyALVQ8AHP/+D0Y2//////////8LDgoID+AA/g9oAeoPIAL//g9yFB0P8FQdDw4eKQ7KGQ5+EA+0ACUPPg0ZDmgAD2RVOw8gAv//uw7KIA/wVDMOgFQPYhQXDxIiMQ+0ADEPHAE1DvIRDyAC//+5DkoYDyACYw+KHS0PbhkVD6IiLQ/+IhkOZigPIAL///9aDtQFD1gCNw+iIikP4h4dDyAC///nDpgJDyACHw9kVCUPoGYZDxBiIQ+iIh0P/iIpD6AKxQ8gAv/yDxQX/g+iIv4PIAL+Dwhb///////////////////////////SDvQqDgArDyAC///+D4Bu////////////////////////////xQ8YACEOLjYPcke1Dr5XD2Q3Iw8gAv//9Q58Wg9ORBMPFkMlDqKOD2KbKw9ONxsPOEAdDkAzDyAC///rD1RrMQ+MbC0PMp8dDwZIKQ9ScS8OTmAPIAL///4PwG8aDlpHDyACaw8Ieh8OJgAPIJsjDyAC///ZD/h3GQ9eSCUPIAI9D25ILQ8kRSsPIAL///4PeqI0D2B5HQ9gBjEPoGwdD+AOJw4ESQ8gAv///g+CYv4Pwmb//g8CAP///////////////////////////////////////////////////////////////////9FQEKUQpRA=",
  // Fonction de log stylisée
  log:function(message, type = 'info'){
    const span = document.createElement('div');
    span.className = type;
    span.textContent = message + '\n';
    $id('output').appendChild(span);
    $id('output').scrollTop = $id('output').scrollHeight;
  },
  clear_log:function() { $id('output').innerHTML = ''; },
  // Utilitaire : Chercher un pattern d'octets
  find_pattern:function(data, pattern) {
    let L=data.length;
    if (L>65536) L=65536;
    for (let i=0; i<=L-pattern.length; i++) {
      let match = true;
      for (let j = 0; j<pattern.length; j++) {
        if (data[i+j]!=pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) return i;
    }
    return -1;
  },
  // Utilitaire : Convertir une chaîne Base64 en Uint8Array
  base64_to_uint8:function(base64) {
    try {
      const binary_string = atob(base64.trim());
      const len = binary_string.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes;
    } catch (error) {
      UI.log(`[-] Erreur lors du décodage Base64 d'une ressource intégrée. Vérifiez son contenu.`, 'error');
      return null;
    }
  },
  // Utilitaire : Injecter des données à un offset fixe (Comportement "dd seek=X")
  inject_bytes:function(dest_data, src_data, offset) {
    if (offset + src_data.length > dest_data.length) {
      UI.log(`[-] Erreur d'injection : L'offset ${offset} + la taille de la ressource (${src_data.length} octets) dépassent la taille du fichier d'origine.`, 'error');
      return false;
    }
    dest_data.set(src_data, offset);
    return true;
  },
  // Déclencheur de téléchargement
  download_file:function(data, original_name, patchsuffix=true) {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ext_index = original_name.lastIndexOf('.');
    const name = ext_index !== -1 ? original_name.substring(0, ext_index) : original_name;
    const ext = ext_index !== -1 ? original_name.substring(ext_index) : '.bin';
    
    a.href = url;
    a.download = patchsuffix?`${name}_patched${ext}`:original_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  // PATCH DU BOOTLOADER
  patch_bootloader:function(data,filename){
    UI.clear_log();
    UI.log('================', 'info');
    UI.log('Patch bootloader', 'info');
    UI.log('================', 'info');
    UI.log(`[*] Analyse du bootloader : (${data.length} octets)`, 'info');
    
    let patched_p1 = false;
    let model=0;
    
    // --- Patch 1 : Version N0120 ---
    const patterns_n0120 = [
      { bytes: new Uint8Array([0x30, 0x62, 0x00, 0x21, 0xF2, 0x6B, 0x07, 0x20]), name: 'N0120 P1.1 (30 62)' },
      { bytes: new Uint8Array([0x20, 0x62, 0x00, 0x21, 0xE2, 0x6B, 0x07, 0x20]), name: 'N0120 P1.2 (20 62)' }
    ];
    
    for (const p of patterns_n0120) {
      const offset = UI.find_pattern(data, p.bytes);
      if (offset !== -1) {
        data[offset] = 0x00; data[offset+1] = 0xBF; // NOP
        if (offset + 13 < data.length) {
          data[offset+12] = 0x00; data[offset+13] = 0xBF; // NOP
	  model=120;
          UI.log(`[+] Matériel détecté : Numworks N0120`, 'success');
          UI.log(`[+] ${p.name} appliqué (NOPs en 0x${offset.toString(16).toUpperCase()} et 0x${(offset+12).toString(16).toUpperCase()})`, 'success');
          patched_p1 = true;
          break;
        }
      }
    }
    
    // --- Patch 1 : Version N0115 ---
    if (!patched_p1) {
      const pattern_n0115 = new Uint8Array([0xC5, 0xF8, 0x14, 0x0C, 0x10, 0x21, 0xD5, 0xF8]);
      const offset_n0115 = UI.find_pattern(data, pattern_n0115);
      if (offset_n0115 !== -1) {
	model=115;
        UI.log(`[+] Matériel détecté : Numworks N0115`, 'success');
        data[offset_n0115] = 0x00; data[offset_n0115+1] = 0xBF;
        data[offset_n0115+2] = 0x00; data[offset_n0115+3] = 0xBF;
        
        const offset_2 = offset_n0115 + 18;
        if (offset_2 + 3 < data.length) {
          data[offset_2] = 0x00; data[offset_2+1] = 0xBF;
          data[offset_2+2] = 0x00; data[offset_2+3] = 0xBF;
          UI.log(`[+] Pattern N0115 appliqué (4 octets NOP en 0x${offset_n0115.toString(16).toUpperCase()} et 0x${offset_2.toString(16).toUpperCase()})`, 'success');
          patched_p1 = true;
        }
      }
    }
    
    if (!patched_p1) {
      UI.log(`[-] Attention : Aucun pattern pour le Patch 1 (N0120/N0115) trouvé.`, 'error');
    }
    
    // --- Patch 2 : BL 0xBC00 Dynamique ---
    pattern_bl = new Uint8Array([0x6B, 0x46, 0x10, 0x68, 0x51, 0x68]);
    offset_bl = UI.find_pattern(data, pattern_bl);
    
    if (offset_bl !== -1) {
      const patch_address = offset_bl + 22;
      const target_address = 0xBC00;
      const pc_address = patch_address + 4;
      let jump_offset = target_address - pc_address;
      
      let jump_val = jump_offset >> 1;
      const S = jump_val < 0 ? 1 : 0;
      if (jump_val < 0) {
        jump_val = (1 << 24) + jump_val;
      }
      
      const I1 = (jump_val >> 22) & 1;
      const I2 = (jump_val >> 21) & 1;
      const J1 = (I1 ^ S) === 0 ? 1 : 0;
      const J2 = (I2 ^ S) === 0 ? 1 : 0;
      
      const imm10 = (jump_val >> 11) & 0x3FF;
      const imm11 = jump_val & 0x7FF;
      
      const first_half = 0xF000 | (S << 10) | imm10;
      const second_half = 0xF800 | (J1 << 13) | (J2 << 11) | imm11;
      
      if (patch_address + 3 < data.length) {
        data[patch_address] = first_half & 0xFF;
        data[patch_address+1] = (first_half >> 8) & 0xFF;
        data[patch_address+2] = second_half & 0xFF;
        data[patch_address+3] = (second_half >> 8) & 0xFF;
        
        UI.log(`[+] [Patch BL] Saut dynamique injecté à l'offset 0x${patch_address.toString(16).toUpperCase()}`, 'success');
        patched_p1 = true;
      }
    } else {
      UI.log(`[-] Pattern 2 (BL) non trouvé.`, 'error');
    }
    
    // --- ÉTAPE INJECTION DES RESSOURCES ---
    UI.log(`[*] Début de l'injection des fichiers binaires embarqués...`, 'info');
    
    const main_bytes = UI.base64_to_uint8(model==115?UI.b64_main115:UI.b64_main);
    const image_bytes = UI.base64_to_uint8(UI.b64_image);
    const about_bytes = UI.base64_to_uint8(UI.b64_about);
    
    let injection_success = true;
    
    if (main_bytes && main_bytes.length > 0) {
      if (UI.inject_bytes(data, main_bytes, 48128)) {
	if (model==115){
	  log(`[+] main115.bin injecté en 48128 (0xBC00) - [${main_bytes.length} octets]`, 'success');
          pattern_bl = new Uint8Array([0x08, 0xb5, 0x01, 0x22, 0x00, 0x21, 0x06, 0x48]);
          offset_bl = find_pattern(data, pattern_bl);
          if (offset_bl>0){
            data[0xbc04]=0;
            data[0xbc05]=0xbf;
            data[0xbdf0]=(offset_bl+1)%256;
            data[0xbdf1]=(offset_bl/256)%256;
            log(`[+] activate screen n115 injecté en 0xBDF0 [${offset_bl+1}]`, 'success');
          }
        }
	else {
          log(`[+] main.bin injecté en 48128 (0xBC00) - [${main_bytes.length} octets]`, 'success');
          pattern_bl = new Uint8Array([0x08, 0xb5, 0x01, 0x22, 0x03, 0x21, 0x06, 0x48]);
          offset_bl = find_pattern(data, pattern_bl);
          if (offset_bl>0){
            data[0xbc04]=0;
            data[0xbc05]=0xbf;
            data[0xbdfc]=(offset_bl+1)%256;
            data[0xbdfd]=(offset_bl/256)%256;
            log(`[+] activate screen n120 injecté en 0xBDFC [${offset_bl+1}]`, 'success');
          }
        }
      } else { injection_success = false; }
    }
    if (image_bytes && image_bytes.length > 0) {
      if (UI.inject_bytes(data, image_bytes, 49344)) {
        UI.log(`[+] image.bin injecté en 49344 (0xC0C0) - [${image_bytes.length} octets]`, 'success');
      } else { injection_success = false; }
    }
    if (about_bytes && about_bytes.length > 0) {
      if (UI.inject_bytes(data, about_bytes, 50992)) {
        UI.log(`[+] about.bin injecté en 50992 (0xC730) - [${about_bytes.length} octets]`, 'success');
      } else { injection_success = false; }
    }
    
    if (patched_p1 && injection_success) {
      UI.log(`[+] Opération globale réussie ! Sauvegarde du bootloader patché...`, 'success');
      UI.download_file(data, filename);
    } else {
      UI.log(`[-] Échec : Le processus de modification a rencontré des erreurs.`, 'error');
    }
    $id('output').scrollIntoView();
  },
  patch_bootloader_from_dfu:function(){
    if (!confirm("Attention! Non compatible avec des calculatrices installees en usine avec Epsilon 25."))
      return;   
    UI.calc=2;
    UI.nws_connect();
    window.setTimeout(UI.patch_bootloader_from_dfu_,100);    
  },
  patch_bootloader_from_dfu_:async function(){
    console.log(UI.calculator,UI.calculator_connected);
    if (UI.calculator==0 || !UI.calculator_connected){
      if (UI.calculator) UI.calculator.stopAutoConnect();
      UI.nws_detect(UI.numworks_retry,UI.nws_detect_failure);
      return;
    }
    let pinfo = await UI.calculator.getPlatformInfo();
    let storageaddr=pinfo["storage"]["address"],bootsize=0x10000;
    UI.calculator.device.startAddress = 0x200000;
    UI.calculator.device.transferSize = 2048;
    if (storageaddr>=0x24000000){ // n0120
      bootsize=0x80000; // should be 0x80000 but crash, why?
      UI.calculator.device.startAddress = 0x08000000;;
    }
    const blob=await UI.calculator.device.do_upload(UI.calculator.device.transferSize,bootsize,false);
    let blobb = await blob.arrayBuffer();
    let dv=new Uint8Array(blobb);
    let filename="epsiloninternal.bin"
    UI.download_file(dv, filename,false);
    UI.patch_bootloader(dv,filename,true);
    setTimeout(() => {
      $id('output').scrollIntoView();
      $id('output').scrollTop = 0;
    }, 0);    
  },
  patch_bootloader_from_file:function(){
    const file = bootloader_input.files[0];
    if (!file) return;    
    const reader = new FileReader();
    reader.onload = function(e) {
      const buffer = e.target.result;
      const data = new Uint8Array(buffer);
      UI.patch_bootloader(data,file.name);
    }
    reader.readAsArrayBuffer(file);
  },
  // PATCH DU KERNEL
  patch_kernel:function(data,filename){
    UI.clear_log();
    UI.log('================', 'info');
    UI.log('  Patch kernel', 'info');
    UI.log('================', 'info');
    let any_kernel_patched = false;
    
    const pattern_k1 = new Uint8Array([0x20, 0x62, 0x00, 0x21, 0xE2, 0x6B, 0x07, 0x20]);
    const offset_k1 = UI.find_pattern(data, pattern_k1);
    if (offset_k1 !== -1) {
      data[offset_k1] = 0x00; data[offset_k1+1] = 0xBF;
      if (offset_k1 + 13 < data.length) {
        data[offset_k1+12] = 0x00; data[offset_k1+13] = 0xBF;
        UI.log(`[+] [Kernel Patch 1] Appliqué (NOPs en 0x${offset_k1.toString(16).toUpperCase()} et 0x${(offset_k1+12).toString(16).toUpperCase()})`, 'success');
        any_kernel_patched = true;
      }
    }
    
    const pattern_k2 = new Uint8Array([0x4F, 0xF0, 0x00, 0x60, 0x05, 0xF1, 0x00, 0x65]);
    const offset_k2 = UI.find_pattern(data, pattern_k2);
    if (offset_k2 !== -1) {
      const patch_addr_k2 = offset_k2 + 8;
      if (patch_addr_k2 + 3 < data.length) {
        data[patch_addr_k2] = 0x00; data[patch_addr_k2+1] = 0xBF;
        data[patch_addr_k2+2] = 0x00; data[patch_addr_k2+3] = 0xBF;
        UI.log(`[+] [Kernel Patch 2] BL neutralisé (2 NOPs insérés à l'offset 0x${patch_addr_k2.toString(16).toUpperCase()})`, 'success');
        any_kernel_patched = true;
      }
    }
    
    const pattern_k3 = new Uint8Array([0xC4, 0xF8, 0x98, 0x0D, 0x4F, 0xF0, 0x10, 0x50]);
    const offset_k3 = UI.find_pattern(data, pattern_k3);
    if (offset_k3 !== -1) {
      const patch_addr_k3 = offset_k3 + 6;
      if (patch_addr_k3 < data.length) {
        data[patch_addr_k3] = 0x00;
        UI.log(`[+] [Kernel Patch 3] Constante modifiée (0x10 -> 0x00 à l'offset 0x${patch_addr_k3.toString(16).toUpperCase()})`, 'success');
        any_kernel_patched = true;
      }
    }
    
    if (any_kernel_patched) {
      UI.log(`[+] Succès ! Sauvegarde du kernel patché...`, 'success');
      UI.download_file(data, filename);
    } else {
      UI.log(`[-] Échec : Aucun pattern Kernel N0120 trouvé.`, 'error');
    }
    setTimeout(() => {
      $id('output').scrollIntoView();
      $id('output').scrollTop = 0;
    }, 0);    
  },
  patch_kernel_from_file:function(){
    const file = kernel_input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const buffer = e.target.result;
      const data = new Uint8Array(buffer);
      UI.log(`[*] Analyse du kernel : ${file.name} (${data.length} octets)`, 'info');
      UI.patch_kernel(data,file.name); 
    }
    reader.readAsArrayBuffer(file);
  },
  patch_kernel_from_dfu:function(){
    UI.calc=2;
    UI.nws_connect();
    window.setTimeout(UI.patch_kernel_from_dfu_,100);    
  },
  patch_kernel_from_dfu_:async function(){
    console.log(UI.calculator,UI.calculator_connected);
    if (UI.calculator==0 || !UI.calculator_connected){
      if (UI.calculator) UI.calculator.stopAutoConnect();
      UI.nws_detect(UI.numworks_retry,UI.nws_detect_failure);
      return;
    }
    let pinfo = await UI.calculator.getPlatformInfo();
    let storageaddr=pinfo["storage"]["address"],bootsize=0x10000;
    if (storageaddr<0x24000000){
      alert(UI.langue?'N0120 uniquement!':'N0120 only');
      return;
    }
    UI.calculator.device.startAddress = 0x90000000;
    UI.calculator.device.transferSize = 0x800;
    const blobk=await UI.calculator.device.do_upload(UI.calculator.device.transferSize,0x10000,false);
    let dv=new Uint8Array(await blobk.arrayBuffer());
    let filename="epsilonkernel.bin";
    UI.download_file(dv, filename,false);
    UI.patch_kernel(dv,filename,true);
  },
  has_kernel_userland:function(data){
    let l=data.byteLength;
    if (l<0x20000) return false;
    let tab=new Uint8Array(data);
    let offset=0x10004; // offset of Epsilon version, check for 15.5
    return tab[offset]!=0x31 || tab[offset+1]!=0x35 || tab[offset+2]!=0x2e || tab[offset+3]!=0x35;
  },
  adjust_exam_sector:function(data){
    let l=data.byteLength;
    if (l<0x3000) return;
    let tab=new Uint8Array(data);
    for (let i=0x1000;i<0x2000;i++)
      tab[i]=0xff;
    for (let i=0x2000;i<0x3000;i++)
      tab[i]=0x0;
  },
  sig_check:async function(sig,data,fname){
    // sig should be a list of lists of size 3 (name, length, hash)
    let i=0,l=sig.length;
    for (;i<l;++i){
      let cur=sig[i];
      let offset=0;
      if (cur[0]=='delta1user.external.bin' && fname=='epsilon.bin')
        offset=0x10000;
      else if (cur[0]=='delta2user.external.bin' && fname=='epsilon.bin')
        offset=0x20000;
      else if (cur[0]=='delta19user.external.bin' && fname=='epsilon.bin')
        offset=0x1b0000;
      else if (cur[0]=='delta29user.external.bin' && fname=='epsilon.bin')
        offset=0x1b0000;
      else if (cur[0]!=fname){
        console.log(cur[0],i);
        continue;
      }
      console.log(cur[0],fname,'sigfile_index',i,'sig_length',cur[1],'offset',offset,'calcdata_length',data.byteLength);
      if (offset+cur[1]>data.byteLength) continue;
      let dat=data.slice(offset,offset+cur[1]);
      let digest = await window.crypto.subtle.digest('SHA-256', dat);
      digest=Array.from(new Uint8Array(digest));
      console.log('signature file sha256',cur[2],'calcdata sha256',digest);
      let j=0;
      for (;j<32;++j){
	let tst=(digest[j]-cur[2][j]) % 256;
	// console.log(j,digest[j],cur[2][j]);
	if (tst)
	  break;
      }
      if (j==32){
	console.log('signature match',cur[0]);
	return offset+1; // 1 for kernel+userland, 1+0x10000/0x20000 for userland only
      }      
    }
    return 0;
  },
  numworks_load:function(backup=false){
    UI.calc=2;
    UI.nws_connect();
    window.setTimeout(UI.numworks_load_,100,backup);
  },
  backup_load:function(file){
    let reader = new FileReader();
    reader.onerror = function (evt) { }
    reader.readAsArrayBuffer(file);
    reader.onload = function (evt) {
      //UI.backup2rec(evt.target.result);
      UI.storage_records=UI.backup2rec(evt.target.result);
      UI.store2html(UI.storage_records,'storelist');
    }
  },
  backup2rec:function(buf){
    let pos=4,nwstoresize=32768;
    let view=new Uint8Array(buf);
    nwstoresize=view.length;
    let rec=[];
    for (;pos<nwstoresize;){
      let L=view[pos+1]*256+view[pos];
      pos += 2;
      if (L==0) break;
      L -= 2;
      let name='',type='',point=false,i;
      for (i=0;i<L;++i){
	let ch=view[pos+i];
	if (ch==0) break;
	if (String.fromCharCode(ch)=='.'){
	  point=true;
	  continue;
	}
	if (point)
	  type += String.fromCharCode(ch);
	else
	  name += String.fromCharCode(ch);
      }
      let len=L-i-2;
      let data=new Uint8Array(buf,pos+i+1,len);
      let code="";
      if (type=="py")
	code=new TextDecoder().decode(new Uint8Array(buf,pos+i+2,len-1));
      let b=new Blob([data], {type: 'application/octet-binary'});
      let record={"name":name, "type":type,  "autoImport": false, "data": b,"code":code,"size": len}
      console.log('backup2rec',rec.length,record);
      rec.push(record)
      pos += L;
    }
    return rec;
  },
should_addsys: async function(file) {
    let storage = await UI.calculator.backupStorage();
    let newrec = [storage.records[0], storage.records[1]];

    // On attend directement la lecture ici
    const arrayBuffer = await file.arrayBuffer();
    
    // On continue seulement quand c'est fini
    UI.storage_records = UI.backup2rec(arrayBuffer);
    
    let rec = UI.storage_records;
    console.log("Lecture terminée, rec est prêt :", rec);
    if (rec.length>=2 && rec[0].name=="pr" && rec[1].nam=="gp")
      return 0; // pr and gp already there
    for (let j=0;j<rec.length;++j)
      newrec.push(rec[j]);
    console.log('adding pr.sys and gp.sys, other records',rec.length,newrec.length);
    storage.records=newrec;
    console.log(newrec);
    console.log(storage);
    await UI.calculator.installStorage(storage, function() {
      // Do stuff after writing to the storage is done
      console.log('backup with added header saved to Numworks');
    });
    return 1;
  },
  numworks_retry:function(){
    alert(UI.langue==-1?'Calculatrice detectee. Reessayez!':'Calculator detected! Try again');
  },
  numworks_load_: async function(backup){
    console.log(UI.calculator,UI.calculator_connected);
    if (UI.calculator==0 || !UI.calculator_connected){
      if (UI.calculator) UI.calculator.stopAutoConnect();
      UI.nws_detect(UI.numworks_retry,UI.nws_detect_failure);
      return;
    }
    if (backup){
      let pinfo = await UI.calculator.getPlatformInfo();
        
      let storage_blob = await UI.calculator.__retreiveStorage(pinfo["storage"]["address"], pinfo["storage"]["size"]);
      console.log('storage size',pinfo["storage"]["size"]);
      filename = "backup.nws";
      saveAs(storage_blob.slice(0,pinfo["storage"]["size"]), filename);
      return;
    }
    let storage = await UI.calculator.backupStorage();
    let rec=UI.storage_records=storage.records;
    let ht=UI.store2html(rec,'storelist'); //console.log(ht);
    return;
    let j=0,s='Choisissez un numero parmi ';
    for (;j<rec.length;++j){
      s+=j;
      s+=':'+rec[j].name+', ';
    }
    let p=prompt(s),n=0;
    if (!p) return;
    let l=p.length;
    for (j=0;j<l;++j){
      if (p[j]<'0' || p[j]>'9'){ alert(UI.langue==-1?'Nombre invalide':'Invalid number'); return ;}
      n*=10;
      n+=p.charCodeAt(j)-48;
    }
    if (n>=rec.length){ alert(UI.langue==-1?'Choix invalide':'Invalide choice'); return; }
    s=rec[n].code; p=rec[n].name;
    let blob = new Blob([s], {type: "text/plain;charset=utf-8"});
    filename = p + ".py";
    saveAs(blob, filename);
  },
  loadFile:function(file){
    let reader = new FileReader();
    reader.onerror = function (evt) { }
    let backup=file.name.length>4 && file.name.substr(file.name.length-4,4)==".nws";
    if (backup){
      if (!confirm(UI.langue==-1?'Remplacer tous les scripts de la calculatrice?':'Overwrite all calculator scripts?'))
	return;
      reader.readAsArrayBuffer(file);
    }
    else
      reader.readAsText(file, "UTF-8");
    reader.onload = function (evt) {
      let data=evt.target.result;
      if (!backup)
	data+=String.fromCharCode(0);
      UI.numworks_save(file,data);
    }
  },
  download:function(url, filename) {
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      })
      .catch(console.error);
  },
  numworks_save:function(file,S){
    //console.log(filename,S); return;
    UI.nws_connect(1);
    //window.setTimeout(UI.numworks_save_,100,filename,S);
    window.setTimeout(UI.numworks_save_,100,file,S);
  },
  numworks_save_:async function(file,S){
    let filename=file.name;
    if (UI.calculator==0 || !UI.calculator_connected){
      alert(UI.langue==-1?UI.chkmsgfr:chkmsgen);
      if (UI.calculator) UI.calculator.stopAutoConnect();
      return -1;
    }
    if (filename.length>4 && filename.substr(filename.length-4,4)==".nws"){
      let pinfo = await UI.calculator.getPlatformInfo();
      UI.calculator.device.startAddress = pinfo["storage"]["address"];
      console.log('numworks_save storage size',pinfo["storage"]["size"]);
      if (pinfo["storage"]["size"]>32768 && UI.should_addsys(file))
        return 0;
      //console.log(UI.calculator.device.startAddress,S); return;
      let res=await UI.calculator.device.do_download(UI.calculator.transferSize, S, false);
      if (res==0)
	alert('Unable to store to the calculator');
      return res;
    }
    if (UI.is_py(filename))
      filename=filename.substr(0,filename.length-3);
    let storage = await UI.calculator.backupStorage();
    let rec=storage.records,j=0;
    for (;j<rec.length;++j){
      if (rec[j].name==filename){
	if (!confirm((UI.langue==-1?'? Ecraser ':'? Overwrite ')+rec[j].name))
	  return;
	rec[j].code=S;
	break;
      }
    }
    if (j==rec.length)
      rec.push({"name": filename, "type":"py", "autoImport": false, "code": S});
    await UI.calculator.installStorage(storage, function() {
      // Do stuff after writing to the storage is done
      console.log(filename+'.py saved to Numworks');
    });
    return 0;
  },    
  numworks_install_slotb:function(version_longue=1,tar_only=0){
    // version_longue==1 pour KhiCAS slots b et a
    // version_longue==2 pour delta+KhiCAS locked
    // ==3 pour unlocked
    // version_longue==0 && tar_only==-1, install lanceur KhiCAS sur Epsilon
    // version_longue==0 && tar_only==-2, install lanceur Delta sur Epsilon
    // tar_only==-3 réinstall lanceur
    if (tar_only==0 && !confirm(UI.langue==-1?'En confirmant l\'installation, vous acceptez la licence GPL2 de KhiCAS [et la licence CC BY-NC-SA de Delta le cas echeant]':'If you confirm install, you accept the GPL2 license of KhiCAS [and the license CC BY-NC-SA of Delta]'))
      return;
    $id('persoinit').style.display='none';    
    UI.calc=2;
    UI.nws_connect();
    window.setTimeout(UI.numworks_install_slotb_,100,version_longue,tar_only);
  },
  numworks_install_slotb_:async function(version_longue=1,tar_only=0){
    if (!UI.calculator_connected){
      alert(UI.lang==-1?'Pas de calculatrice trouvée. Cliquez sur le bouton Détecter.':'No calculator found. Click on the Detect button');
      return;
    }
    if (tar_only==0 || tar_only==-1 || tar_only==-2 || tar_only==-3){
      let pinfo = await UI.calculator.getPlatformInfo();
      let sector=(Math.floor(UI.calculator.device.endslot/65536)+1);
      let appstart=0x90000000+sector*65536;
      let n120=UI.calculator.device.startAddress >= 0x24000000;
      let n120s=(n120?'120':'110');
      let appfile='sector'+sector.toString(16)+'v'+UI.calculator.device.epsilon+(n120?'.120':'.110');
      let installdelta='n'+n120s+'redist';
      if (version_longue==3)
        installdelta += '_unlocked';
      let eps=UI.calculator.device.epsilon;
      console.log(eps);
      // N.B. for Delta, eps=='23.12.0', the "normal" install procedure
      // will work, it's just that the shifted Delta userland is not useful
      eps=eps.substring(0,2);
      let n110_19=!n120 && eps=='19';
      if (eps<'22'){
        installdelta += '19';
        if (version_longue==3 && n110_19){
          alert('Please upgrade kernel to version 22 at least.');
          return 22;
        }
      }
      installdelta += '.bin';
      let rundelta='rundelta'+n120s+'_sector';
      let deltasector=0x170000;
      if (n120){
        if (eps=='19' || eps=='24')
          rundelta += '17';
        else if (eps=='25' || eps=='20'){
          deltasector=0x180000;
          rundelta += '18';
        }
        else { // 21, 22, 23
          rundelta += '19';
          deltasector=0x190000;
        }
      } else {
        if (eps=='24' || eps=='25')
          rundelta += '17';
        else if (eps=='19'){
          deltasector=0x150000;
          rundelta += '15';
        }
        else if (eps=='21' || eps=='22'){
          deltasector=0x180000;
          rundelta += '18';
        }
        else {
          rundelta += '19';
          deltasector=0x190000;
        }
      }
      console.log('install_slotb version_longue tar_only',version_longue,tar_only);
      if (version_longue==2 || version_longue==3 || tar_only==-2 || tar_only==-3){
        console.log('delta',n120s,installdelta,rundelta,deltasector.toString(16),eps);
        //return 0; // debug
      }
      else {
        console.log('file transfered',appfile,'1st external app address','0x'+appstart.toString(16));
        UI.print('file transfered '+appfile+', 1st external app address 0x'+appstart.toString(16));
      }
      if (tar_only==-1){ // run khicas from Epsilon
	      UI.calculator.device.startAddress = appstart; // n120?0x90190000:0x90180000;
	      UI.calculator.device.logProgress(0,'KhiCAS launcher at '+appstart.toString(16));
	      let data=await UI.loadfile(appfile);
	      // let data=await UI.loadfile(n120?"sector19":"sector18");
	      let res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
	      if (res==0){
	        alert(UI.langue==-1?'Erreur d\'ecriture flash':'Error writing flash');
	        return 2;
	      }
        return 0;
      }
      if (version_longue==3){
	      UI.calculator.device.startAddress = n120?0x90020000:0x90010000;
	      UI.calculator.device.logProgress(0,'Delta unlocked+extapp');
	      let data=await UI.loadfile(installdelta);
	      let res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
	      if (res==0){
	        alert(UI.langue==-1?'Erreur d\'ecriture flash. Reessayer depuis reset+6':'Error writing flash. Try again from reset+6');
	        return 2;
	      }
        return 0;
      }
      if (version_longue==2){
	      UI.calculator.device.startAddress = 0x901b0000;
	      UI.calculator.device.logProgress(0,'Delta (1b)+extapp');
	      let data=await UI.loadfile(installdelta);
	      let res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
	      if (res==0){
	        alert(UI.langue==-1?'Erreur d\'ecriture flash sur la fin du slot A ou dans le slot B. Reessayer depuis reset+6':'Error writing flash at end of slot A or in slot B. Try again from reset+6');
	        return 2;
	      }
        tar_only=-2; 
      }
      if (tar_only==-3){ // reactivater le lanceur de delta 
        if (n110_19){
          // model=n0110 19.5.0 or n0115 19.5.9?
          let n115=UI.calculator.device.epsilon=='19.5.9';
          if (n115)
            UI.calculator.device.startAddress=0x2001446c;
          else
            UI.calculator.device.startAddress=0x20009bf8;
          UI.calculator.transferSize=4;
	        let data=await UI.loadfile('0x1');
	        let res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
	        if (res==0){
	          alert(UI.langue==-1?'Erreur d\'ecriture':'Write error');
	          return 2;
	        }
          return 0;
        }
        tar_only=-2;
      }
      if (tar_only==-2){ // run delta from Epsilon
	      UI.calculator.device.startAddress = 0x90000000+deltasector; 
	      UI.calculator.device.logProgress(0,'Delta launcher at '+UI.calculator.device.startAddress.toString(16));
	      let data=await UI.loadfile(rundelta);
	      // let data=await UI.loadfile(n120?"sector19":"sector18");
	      let res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
	      if (res==0){
	        alert(UI.langue==-1?'Erreur d\'ecriture flash':'Error writing flash');
	        return 2;
	      }
        if (n110_19){
          // model=n0110 19.5.0 or n0115 19.5.9?
          let n115=UI.calculator.device.epsilon=='19.5.9';
          if (n115)
            UI.calculator.device.startAddress=0x2001446c;
          else
            UI.calculator.device.startAddress=0x20009bf8;
          UI.calculator.transferSize=4;
	        let data=await UI.loadfile('0x1');
	        let res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
	        if (res==0){
	          alert(UI.langue==-1?'Erreur d\'ecriture':'Write error');
	          return 2;
	        }
          return 0;
        }
        return 0;
      }
      if (version_longue){
	UI.calculator.device.startAddress = 0x90260000;
	UI.calculator.device.logProgress(0,'KhiCAS slot A at 0x90260000');
	let data=await UI.loadfile(n120?"khi120a":"khi110a");
	let res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
	if (res==0){
	  alert(UI.langue==-1?'Erreur d\'ecriture flash sur la fin du slot A':'Error writing flash at end of slot A');
	  return 2;
	}
      }
      let fich=n120?"khi120b.tar":"khi110b.tar";
      if (version_longue)
        fich=n120?"khi120ab.tar":"khi110ab.tar";
      console.log(UI.calculator.device.startAddress,fich);
      UI.calculator.device.startAddress = 0x90400000;
      UI.calculator.device.logProgress(0,'KhiCAS slot B at 0x90400000');
      let data=await UI.loadfile(fich);
      let res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
      if (res==0){
	alert(UI.langue==-1?'Erreur d\'ecriture flash. Redémarrez depuis le slot A, cela peut être fait en tapant reset+6 puis mise à jour depuis le site de Numworks':'Error writing flash. Restart the calc from slot A, this can be done by Reset+6 then upgrade from Numworks site');
	return 3;
      }
    }
    if (tar_only==1
        || (!version_longue && confirm(UI.langue==-1?"Installer les scripts et sessions exemples?":"Install script and example sessions?"))
       ){
      UI.appsaddress = UI.calculator.device.startAddress = 0x90200000;
      UI.calculator.device.logProgress(0,'KhiCAS script and examples at 0x90200000');
      let data=await UI.loadfile('khi92.tar');
      let res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
      if (res==0)
	alert(UI.langue==-1?'Erreur d\'ecriture flash.':'');
    }
    alert(UI.langue==-1?"Pour finir l'installation, installez le lanceur ou fermez cet onglet et installez khicas.nwa depuis https://my.numworks.com/apps. Vous devrez répéter l'installation du lanceur ou de khicas.nwa depuis le site de Numworks à chaque RESET/crash tant que Numworks n'a pas corrigé le support des apps externes.":"Install launcher or close this browser tab and install khicas.nwa from https://my.numworks.com/apps. You will have to reinstall the launcher or khicas.nwa from Numworks site after every calculator RESET/crash until Numworks fixes external apps support.");
    return 0;
  },
  numworks_install_delta:function(do_backup=1,khionly=0){
    if (khionly && !confirm(UI.langue==-1?'En confirmant l\'installation, vous acceptez la licence CC BY-NC-SA de Khi':'If you confirm, you accept the CC BY-NC-SA license of Khi.'))
      return;
    if (!khionly && !confirm(UI.langue==-1?'En confirmant l\'installation, vous acceptez les licences CC BY-NC-SA de Khi et GPL2 de KhiCAS, BSD2 Hexedit, LGPL2 de Nofrendo, MIT de Peanut-GB':'If you confirm install, you accept the CC BY-NC-SA license of Khi and GPL2 license of KhiCAS, BSD2 for Hexedit, LGPL2 for Nofrendi, MIT for Peanut-GB'))
      return;
    $id('persoinit').style.display='none';    
    UI.calc=2;
    UI.nws_connect();
    window.setTimeout(UI.numworks_install_delta_,100,do_backup,khionly);
  },
  numworks_install_delta_:async function(do_backup,khionly){
    if (khionly==5){
      UI.calculator.device.startAddress = 0x90180000;
      UI.calculator.device.logProgress(0,'khi slot B');
      let data=await UI.loadfile('khi.B.bin');
      let res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
      if (res==0){
	alert(UI.langue==-1?'Erreur d\'ecriture flash. Tapez reset+4 et reessayez':'Error writing flash. Type reset+4 and try again.');
	return 3;
      }
      alert(UI.langue==-1?'Tapez reset+2 pour booter un lanceur minimal de KhiCAS sur le slot B. Ceci augmente la memoire de 50% environ. Attention, cela ne fonctionnera que si vous installez le bootloader de cette page!':'Type reset+2 to boot a minimal KhiCAS launcher from slot B. This increases memory available. Beware this works only if you install the bootloader of this page!');
      UI.print('Khi slot B OK, press RESET on calculator back');
      return 0;
    }
    if (khionly==4){
      UI.calculator.device.startAddress = 0x08000000;
      UI.calculator.device.logProgress(0,'protection');
      let data=await UI.loadfile('bootloader.bin');
      let res=0;
      res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
      if (res==0){
	alert(UI.langue==-1?'Erreur d\'ecriture flash interne. Tapez reset+6 et reessayez. Si reset+6 ne fonctionne pas, essayez de deverrouiller votre Numworks sur phi.getomega.dev':'Error writing internal flash. Type reset+6 and try again. If reset+6 does not work, try to unlock your Numworks on phi.getomega.dev');
	return 3;
      }
      alert(UI.lang==-1?'Le multi-boot permet de lancer 2 firmwares A (<=1.5M) et B(<=0.5M) : reset-1 ou reset-2 permet de changer. Si vous installez Khi A et B, votre calculatrice sera protegee contre des mises a jour (risque de verrouillage). Cette protection se desactive temporairement par reset-4, par exemple pour mettre a jour Khi. Tapez reset+6 pour effacer le multiboot':'With multi-boot installed you can run 2 firmwares A (<=1.5M) and B (<=0.5M). If you install Khi A and B, your calculator will be protected against upgrade (lock risk). Type reset-4 to temporarily remove firmware protection, e.g. to upgrade Khi. Type reset-6 to remove the multi-boot');
      UI.print('Bootloader OK, press RESET on calculator back');
      return 0;
    }
    if (UI.calculator==0 || !UI.calculator_connected){
      alert(UI.langue==-1?UI.chkmsgfr:chkmsgen);
      if (UI.calculator) UI.calculator.stopAutoConnect();
      return -1;
    } 
    UI.print(khionly?'=========== installing Khi':'=========== installing Khi and KhiCAS');
    let data,res;
    if (!khionly){
      UI.print('erase/write KhiCAS apps, wait about 2 minutes');
      data=await UI.loadfile('apps.tar');
      UI.appsaddress = UI.calculator.device.startAddress = 0x90200000;
      UI.calculator.device.logProgress(0,'apps');
      res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
      UI.print(res?'KhiCAS installed':'error installing KhiCAS');
      if (res==0){
	alert('error installing KhiCAS');
	return 1;
      }
    }
    let installboot=0;
    let pinfo = await UI.calculator.getPlatformInfo();
    if (pinfo["bootloader"]==0 || khionly==3){
      installboot=1;
      if (khionly==3) // skip protection question parameter
	khionly=1;
      else {
	if (1 ||
	    confirm(UI.langue==-1?'Votre calculatrice n\'est pas protegee contre un verrouillage. Voulez-vous la proteger?':'Your calculator is not protected against an hostile lock. Protect?')){
	  alert(UI.langue==-1?'Le bootloader de protection sera installe. Vous pourrez l\'effacer avec reset+6. Attention, ceci ne protege pas d\'une mise a jour sur le site de Numworks.':'Protecting bootloader will be installed, you will be able to remove it with reset+6. Beware, this does not protect from running an upgrade from Numworks.');
	  khionly=2;
	}
	else
	  khionly=1;
      }
    }
    else
      khionly=2;
    UI.print('erase/write Khi external, wait about 1/2 minute');
    UI.calculator.device.startAddress = 0x90000000;
    let firmwarename=khionly==2?'khi.A.bin':'delta.external.bin';
    data=await UI.loadfile(firmwarename);
    UI.calculator.device.logProgress(0,firmwarename);
    res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
    if (res==0){
      alert('Error writing Khi');
      return 2;
    }
    UI.calculator.device.startAddress = 0x90180000;
    UI.calculator.device.logProgress(0,'khi slot 2');
    data=await UI.loadfile('khi.B.bin');
    res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
    if (installboot){
      UI.print('Khi external OK, erase/write internal');
      UI.calculator.device.startAddress = 0x08000000;
      UI.calculator.device.logProgress(0,'internal');
      data=await UI.loadfile(khionly==2?'bootloader.bin':'delta.internal.bin');
      res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, false);
      if (res==0){
	alert(UI.langue==-1?'Erreur d\'ecriture flash interne. Tapez reset+6, installez le mode de recuperation et reessayez.':'Error writing internal flash. Type reset+6, run rescue mode and try again');
	return 3;
      }
      UI.print((installboot?'Bootloader OK':'Khi internal OK')+', press RESET on calculator back');
    }
    else 
      UI.print('Khi external OK');
    alert(UI.langue==-1?'Installation terminee. Appuyer sur RESET a l\'arriere de la calculatrice':'Install success. Press RESET on the calculator back.');
    return 0;
  },
  loadfile:function(file) {
    return fetch(file).then(function(response) {
      if (!response.ok) {
        throw new Error("HTTP error, status = " + response.status);
      }
      return response.arrayBuffer();
    })
  },
  numworks_activateapps_:async function(){
    if (UI.calculator==0 || !UI.calculator_connected){
      alert(UI.langue==-1?UI.chkmsgfr:chkmsgen);
      //console.log('numworks_rescue_',UI.calculator);
      if (UI.calculator) UI.calculator.stopAutoConnect();
      UI.calculator=0;
      return -1;
    }
    // UI.print(UI.langue==-1?'Rendre les applications externes visibles fonctionne avec Epsilon 19.5':'Works with Epsilon 19.5');
    const address = 0x90200000;
    // Commande DFUse (via DFU_DNLOAD)
    const buf = new ArrayBuffer(5);
    const view = new DataView(buf);
    view.setUint8(0, 0x21);  // SET_ADDRESS_POINTER (commande DFUse)
    view.setUint32(1, 0x90200000, true);
    
    await UI.calculator.device.device_.controlTransferOut({
      requestType: 'class',
      recipient: 'interface',
      request: 0x01,  // DFU_DNLOAD (commande DFU standard)
      value: 0,
      index: 0
    }, buf);
    
    // 2. Attendre et vérifier le statut
    await new Promise(r => setTimeout(r, 50));
    
    let st=await UI.calculator.device.device_.controlTransferIn({
      requestType: 'class',
      recipient: 'interface',
      request: 0x03,      // DFU_GETSTATUS
      value: 0,
      index: 0
    }, 6);  // 6 bytes de statut DFU
    console.log(st);
    
    st=await UI.calculator.device.device_.controlTransferIn({
    requestType: 'class',
      recipient: 'interface',
      request: 0x03,      // DFU_GETSTATUS
      value: 0,
      index: 0
    }, 6);  // 6 bytes de statut DFU
    console.log(st);      
    
    
    // 3. Paquet vide avec wValue=0 pour terminer la commande SET_ADDRESS
    await UI.calculator.device.device_.controlTransferOut({
      requestType: 'class',
      recipient: 'interface',
      request: 0x01,      // DFU_DNLOAD
      value: 2,           // wValue = 2 for leave
      index: 0
    }, new ArrayBuffer(0));
    
    st=await UI.calculator.device.device_.controlTransferIn({
      requestType: 'class',
      recipient: 'interface',
      request: 0x03,      // DFU_GETSTATUS
      value: 0,
      index: 0
    }, 6);  // 6 bytes de statut DFU
    console.log(st);
    return;
    // 4. :leave - DFU_DETACH
    await UI.calculator.device.device_.controlTransferOut({
      requestType: 'class',
      recipient: 'interface',
      request: 0x00,      // DFU_DETACH
      value: 0,
      index: 0
    });
  },
  numworks_activateapps:async function(){
    if (UI.calculator==0 || !UI.calculator_connected){
      let res=await UI.nws_connect();
      if (res==-1) return;
    }
    window.setTimeout(UI.numworks_activateapps_,100);
  },
  numworks_rescue:async function(){
    alert(UI.langue==-1?'Connectez la calculatrice, appuyez sur la touche 6 de la calculatrice, enfoncez un stylo dans le bouton RESET au dos en laissant la touche 6 appuyee, relachez la touche 6, l\'ecran doit etre eteint et la diode rouge allumee':'Connect the calculator, press the 6 key on the calculator, press the RESET button on the back keeping the 6 key pressed, release the 6 key, the screen should be down and the led should be red');
    UI.calc=2;
    let res=await UI.nws_rescue_connect();
    if (res==-1){
      return;
    }
    window.setTimeout(UI.numworks_rescue_,1000);
  },
  numworks_rescue_:async function(sigfile,rwcheck){
    if (UI.calculator==0 || !UI.calculator_connected){
      alert(UI.langue==-1?UI.chkmsgfr:chkmsgen);
      //console.log('numworks_rescue_',UI.calculator);
      if (UI.calculator) UI.calculator.stopAutoConnect();
      UI.calculator=0;
      return -1;
    }
    UI.print(UI.langue==-1?'Envoi du mode de recuperation, patientez environ 15 secondes':'Sending rescue mode, wait about 15 secondes');
    UI.calculator.device.startAddress = 0x20030000;
    let data=await UI.loadfile('recovery');
    await UI.calculator.device.clearStatus();
    let res=await UI.calculator.device.do_download(UI.calculator.transferSize, data, true);
    if (res==0){
      alert('Error sending recovery');
      return 1;
    }
    let tmp=confirm(UI.langue==-1?'La calculatrice devrait etre en mode recuperation. Cliquer sur le bouton Detecter puis sur install KhiCAS':'Calculator should be in rescue mode. Click on the Detect button then install KhiCAS.');
    return 0;
    if (tmp)
      UI.nws_detect(UI.numworks_install_delta,UI.nws_detect_failure);
    else
      UI.nws_detect(UI.numworks_detect_success,UI.nws_detect_failure);
  },
  numworks_buffer:0,
  read_string:function(buffer,str_offset, size) {
    let strView = new Uint8Array(buffer, str_offset, size);
    let i = 0;
    let rtnStr = "";
    while(strView[i] != 0) {
      rtnStr += String.fromCharCode(strView[i]);
      i++;
    }
    return rtnStr;
  },
  // tar support adapted from tarball.js https://github.com/ankitrohatgi/tarballjs (MIT licence)
  filename(buffer,header_offset) {
    let name = UI.read_string(buffer,header_offset, 100);
    return name;
  },
  filetype(buffer,header_offset) {
    // offset: 156
    let typeView = new Uint8Array(buffer, header_offset+156, 1);
    let typeStr = String.fromCharCode(typeView[0]);
    if(typeStr == "0") {
      return "file";
    } else if(typeStr == "5") {
      return "directory";
    } else {
      return typeStr;
    }
  },
  filesize(buffer,header_offset) {
    // offset: 124
    let szView = new Uint8Array(buffer, header_offset+124, 12);
    let szStr = "";
    for(let i = 0; i < 11; i++) {
      let tmp=szView[i];
      if (tmp<48 || tmp>57) return -1; // invalid file size
      szStr += String.fromCharCode(tmp);
    }
    return parseInt(szStr,8);
  },
  numworks_chk_buffer:function(buffer){
    if (buffer==0){
      alert(UI.langue==-1?'Commencez par recuperer la flash de la calculatrice':'First get the calculator flash');
      return 0;
    }
    // FIXME should check that buffer is valid
    return 1;
  },
  numworks_tarinfo:function(buffer){
    if (!UI.numworks_chk_buffer(buffer))
      return [];
    let offset = 0;
    let file_size = 0;       
    let file_name = "";
    let file_type = null;
    let file_info=[];
    while(offset < buffer.byteLength - 512) {
      file_name = UI.filename(buffer,offset); // file name
      if (file_name.length == 0) break;
      file_type = UI.filetype(buffer,offset);
      file_size = UI.filesize(buffer,offset);
      if (file_size<0) break;
      file_info.push({
        "name": file_name,
        "type": file_type,
        "size": file_size,
        "header_offset": offset
      });
      offset += (512 + 512*Math.trunc(file_size/512));
      if(file_size % 512) {
        offset += 512;
      }
    }
    return file_info;
  },
  leftpad:function(number,targetLength) {
    let output = number + '';
    while (output.length < targetLength) {
      output = '0' + output;
    }
    return output;
  },
  numworks_maxtarsize:0x600000-0x10000,
  arrayBufferTransfer:function(oldBuffer, newByteLength) {
    const srcArray  = new Uint8Array(oldBuffer),
          destArray = new Uint8Array(newByteLength),
          copylen = Math.min(srcArray.buffer.byteLength, destArray.buffer.byteLength),
          floatArrayLength   = Math.trunc(copylen / 8),
          floatArraySource   = new Float64Array(srcArray.buffer,0,floatArrayLength),
          floarArrayDest     = new Float64Array(destArray.buffer,0,floatArrayLength);
    floarArrayDest.set(floatArraySource);
    let bytesCopied = floatArrayLength * 8;
    // slowpoke copy up to 7 bytes.
    while (bytesCopied < copylen ) {
      destArray[bytesCopied]=srcArray[bytesCopied];
      bytesCopied++;
    }
    return destArray.buffer;
  },
  tar_filesize:function(s){
    return 512*(1+Math.ceil(s/512));
  },
  _readString:function(buffer,str_offset, size) {
    let strView = new Uint8Array(buffer, str_offset, size);
    let i = 0;
    let rtnStr = "";
    while(i<size) {
      let ch=strView[i];
      if (ch<32) break;
      rtnStr += String.fromCharCode(ch);
      i++;
    }
    return rtnStr;
  },
  _readFileName:function(buffer,header_offset) {
    return UI._readString(buffer,header_offset, 100);
  },
  _readFileType:function(buffer,header_offset) {
    // offset: 156
    let typeView = new Uint8Array(buffer, header_offset+156, 1);
    let typeStr = String.fromCharCode(typeView[0]);
    if(typeStr == "0") {
      return "file";
    } else if(typeStr == "5") {
      return "directory";
    } else {
      return typeStr;
    }
  },
  _readFileSize:function(buffer,header_offset) {
    // offset: 124
    let szView = new Uint8Array(buffer, header_offset+124, 12);
    let szStr = "";
    for(let i = 0; i < 11; i++) {
      let tmp=szView[i];
      if (tmp<48 || tmp>57) return -1; // invalid file size
      szStr += String.fromCharCode(tmp);
    }
    return parseInt(szStr,8);
  },
  tar_clear:function(buffer){
    let view = new Uint8Array(buffer);
    for (let i=0;i<1024;++i)
      view[i]=0;
    $id('listtarfiles').innerHTML="";
    $id('perso').style.display='inline';    
  },
  tar_fileinfo:function(buffer,dohtml=1){
    let fileInfo = [];
    let offset = 0;
    let file_size = 0;       
    let file_name = "";
    let file_type = null;
    while (offset < buffer.byteLength - 512) {
      file_name = UI._readFileName(buffer,offset); // file name
      if (file_name.length == 0) 
        break;
      file_type = UI._readFileType(buffer,offset);
      file_size = UI._readFileSize(buffer,offset);
      if (file_size<0)
	break;
      //console.log(offset,file_name,file_size);
      fileInfo.push({
        "name": file_name,
        "type": file_type,
        "size": file_size,
        "header_offset": offset
      });

      offset += UI.tar_filesize(file_size);
    }
    //console.log('fileinfo',offset,dohtml);
    if (dohtml) UI.fileinfo2html(buffer,fileInfo,'listtarfiles');
    return fileInfo;
  },
  is_py:function(name,ext='.py'){
    return name.length>3 && name.substr(name.length-3,3)==ext;
  },
  fileinfo2html:function(buffer,finfo,fieldname){
    let l=finfo.length,s="<ul style='max-height:300px;overflow:auto'>";
    for (let i=0;i<l;++i){
      let cur=finfo[i];
      let S="<li>";
      let name=cur.name;
      S += name;
      S += " (";
      S += cur.size;
      S += "): ";
      let is_py=UI.is_py(name),is_xw=UI.is_py(name,'.xw');
      if (is_py || is_xw){
	let view='';
	let offset=cur.header_offset+512;
	let buf=new Uint8Array(buffer);
	for (let j=0;j<cur.size;++j)
	  view += String.fromCharCode(buf[offset+j]);
	S += '<a href="xcas'+(UI.langue==-1?'fr':'en')+'.html#exec&python=4&'+(is_py?'py':'xw')+'=0,0,'+encodeURIComponent(view)+'" target="_blank">Test</a>, ';
      }
      S += "<button onclick='UI.tar_removefile(UI.numworks_buffer,";
      S += '"'+cur.name+'"';
      S += i<11?',2':',1';
      S +=");' title='Cliquer ici pour effacer ce fichier'>X</button>";
      S += "<button onclick='UI.tar_savefile(";
      S += '"'+cur.name+'"';
      S +=");' title='Cliquer ici pour sauvegarder ce fichier'>&#x1f4be;</button>";      
      s+=S;
    }
    s += "</ul>";
    if (UI.langue==-1)
      s += UI.xcasfrmsg;
    else
      s += UI.xcasenmsg;
    //console.log(s);
    // put it the list of tarfiles
    if (fieldname){
      let field=$id(fieldname);
      console.log(field);
      field.innerHTML=s;
      field.style.display='inline';
      field=field.parentNode.style.display='inline';
    }
    // $id('perso').style.display='inline';
    return s;
  },
  storage_records:[],
  store_savefile:function(filename){
    let rec,j=0;
    for (j=0;j<UI.storage_records.length;++j){
      rec=UI.storage_records[j];
      // console.log(filename,rec.name);
      if (rec.name==filename) break;
    }
    if (j==UI.storage_records.length) return;
    //console.log(filename,rec);
    if (rec.type=="py")
      saveAs( new Blob([rec.code], {type: "text/plain;charset=utf-8"}), rec.name+"."+rec.type);
    else {
      saveAs(rec.data, rec.name+"."+rec.type);
    }
  },
  store2html:function(finfo,fieldname){
    let l=finfo.length,s="<ul style='max-height:300px;overflow:auto'>";
    for (let i=0;i<l;++i){
      let cur=finfo[i];
      let S="<li>";
      S += cur.name+"."+cur.type;
      S += " (";
      S += (cur.type=="py")?(cur.data.size-1):cur.data.size;
      S += "): ";
      if (cur.type=="py")
	S += '<a href="xcas'+(UI.langue==-1?'fr':'en')+'.html#exec&python=4&py=0,0,'+encodeURIComponent(cur.code)+'" target="_blank">Test</a>, ';
      //S += "<button onclick='UI.store_removefile(UI.numworks_buffer,";
      //S += '"'+cur.name+'"';
      //S +=");' title='Cliquer ici pour effacer ce fichier'>X</button>";
      S += "<button onclick='UI.store_savefile(";
      S += '"'+cur.name+'"';
      S +=");' title='Cliquer ici pour sauvegarder ce fichier'>&#x1f4be;</button>";      
      s+=S;
    }
    s += "</ul>";
    if (UI.langue==-1)
      s += UI.xcasfrmsg;
    else
      s += UI.xcasenmsg;
    //console.log(s);
    // put it the list of tarfiles
    if (fieldname){
      s += '<button onclick="$id(\''+fieldname+'\').style.display=\'none\'">X</button>';
      let field=$id(fieldname);
      field.innerHTML=s;
      field.style.display='inline';
      return s;
    }
    // $id('perso').style.display='inline';
    return s;
  },
  tar_writestring:function(buffer,str, offset, size) {
    let strView = new Uint8Array(buffer, offset, size);
    for(let i = 0; i < size; i++) {
      if (i < str.length) {
        strView[i] = str.charCodeAt(i);
      } else {
        strView[i] = 0;
      }
    }
  },
  tar_writechecksum:function(buffer,header_offset) {
    // offset: 148
    UI.tar_writestring(buffer,"        ", header_offset+148, 8); // first fill with spaces

    // add up header bytes
    let header = new Uint8Array(buffer, header_offset, 512);
    let chksum = 0;
    for (let i = 0; i < 512; i++) {
      chksum += header[i];
    }
    UI.tar_writestring(buffer,UI.leftpad(chksum.toString(8),6), header_offset+148, 8);
    UI.tar_writestring(buffer," ",header_offset+155,1); // add space inside chksum field
  },
  tar_fillheader:function(buffer,offset,exec=0){
    let uid = 501;
    let gid = 20;
    let mode = exec?"755":"644";
    let mtime = Date.now();
    let user = "user";
    let group = "group";

    UI.tar_writestring(buffer,UI.leftpad(mode,6)+" ", offset+100, 8);  
    UI.tar_writestring(buffer,UI.leftpad(uid.toString(8),6)+" ",offset+108,8);
    UI.tar_writestring(buffer,UI.leftpad(gid.toString(8),6)+" ",offset+116,8);
    UI.tar_writestring(buffer,UI.leftpad(Math.trunc(mtime/1000).toString(8),11)+" ",offset+136,12);

    //UI.tar_writestring(buffer,"ustar", offset+257,6); // magic string
    //UI.tar_writestring(buffer,"00", offset+263,2); // magic version
    UI.tar_writestring(buffer,"ustar  ", offset+257,8);
    
    UI.tar_writestring(buffer,user, offset+265,32); // user
    UI.tar_writestring(buffer,group, offset+297,32); //group
    UI.tar_writestring(buffer,"000000 ",offset+329,7); //devmajor
    UI.tar_writestring(buffer,"000000 ",offset+337,7); //devmajor
    UI.tar_writechecksum(buffer,offset);
  },
  tar_adddata:function(buffer,filename,data,exec=0,updatehtml=1){
    console.log('tar_adddata',exec,UI.tar_first_modif_offset);
    let finfo=UI.tar_fileinfo(buffer,0);
    let s=finfo.length,offset=0;
    if (s!=0){
      let last=finfo[s-1];
      offset=last.header_offset;
      offset += UI.tar_filesize(last.size);
    }
    let newsize=offset+1024+data.byteLength;
    newsize=10240*Math.ceil(newsize/10240);
    if (newsize>UI.numworks_maxtarsize) return 0;
    // console.log(buffer.byteLength,newsize);
    // resize buffer
    if (buffer.byteLength<newsize){
      buffer=UI.arrayBufferTransfer(buffer,newsize);
      if (updatehtml) UI.numworks_buffer=buffer;
    }
    console.log(buffer.byteLength,newsize);
    let view = new Uint8Array(buffer);    
    // add header
    // fill header with 0
    for (let i=0;i<1024;++i)
      view[offset+i]=0;
    UI.tar_writestring(buffer,filename,offset,100); // filename
    UI.tar_writestring(buffer,UI.leftpad(data.byteLength.toString(8),11)+" ",offset+124,12);  // filesize
    UI.tar_writestring(buffer,"0",offset+156,1); // file type
    UI.tar_fillheader(buffer,offset,exec);
    //let tmp=new Uint8Array(buffer,offset); console.log(tmp);
    //console.log(data.byteLength);
    // copy data 
    let srcview = new Uint8Array(data, 0, data.byteLength);
    let i=0;  
    for (;i<data.byteLength;++i)
      view[offset+512+i]=srcview[i];
    for (;i<((data.byteLength+511)/512)*512;++i)
      view[offset+512+i]=0;
    let F=UI.tar_fileinfo(buffer,updatehtml);
    // console.log('tar_adddata',F);
    return buffer;
  },
  tar_removefile:function(buffer,filename,really=1){
    let finfo=UI.tar_fileinfo(buffer,0);
    let s=finfo.length;
    if (s==0) return 0;
    let i = finfo.findIndex(info => info.name == filename);
    if (i<0 || i>=s) return 0;
    if (really){
      msg = (UI.langue==-1?'Effacer ':'Erase ')+filename+'. ';
      msg += UI.langue==-1?'Etes-vous sur?':'Are you sure?';
      if (really==2)
	msg += (UI.langue==-1?'\nSi vous confirmez, votre firmware ne sera plus certifié conforme mode examen français!':'If you confirm, your firmware will not be exam-certified!');
      if (!confirm(msg))
	return 0;
    }
    let info = finfo[i];
    let view = new Uint8Array(buffer);
    // move info.header_offset+info.size+512 to info.header_offset
    let target=info.header_offset;
    if (target<UI.tar_first_modif_offset){
      UI.tar_first_modif_offset=target;
      console.log('tar_removefile',UI.tar_first_modif_offset);
    }
    let src=target+UI.tar_filesize(info.size);
    let infoend=finfo[s-1];
    let end=infoend.header_offset+UI.tar_filesize(infoend.size);
    for (src;src<end;++src,++target)
      view[target]=view[src];
    for (;target<end;++target) // clear space after new end
      view[target]=0;
    return UI.tar_fileinfo(buffer,1);
  },
  tar_addfile:function(file){
    let reader = new FileReader();
    reader.onerror = function (evt) { }
    reader.readAsArrayBuffer(file);
    reader.onload = function(evt){
      let fname=file.name,exec=1;
      if (fname.length>4 && fname.substr(fname.length-4,4)==".tar"){
	let reader = new FileReader();
	reader.onerror = function (evt) { }
	reader.readAsArrayBuffer(file);
	reader.onload = function(evt){
	  let buffer=evt.target.result;
	  let finfo=UI.tar_fileinfo(buffer,1),l=finfo.length;
	  for (let i=0;i<l;++i){ 
	    let cur=finfo[i];
	    let name=cur.name;
	    // check if name should be archived (not archived if it is in apps)
	    let size=cur.size;
	    let offset=cur.header_offset+512;
	    let data=new Uint8Array(buffer,offset,size);
	    if (UI.tar_adddata(UI.numworks_buffer,name,data,0,1)==0){
	      alert(UI.langue==-1?'Pas d\'espace en memoire flash':'No space left in flash');
	      return;
	    }
	  }
	}
	return;
      }
      if (fname.length>4 && fname.substr(fname.length-4,4)==".zip"){
	let zip=new JSZip();
	zip.loadAsync(evt.target.result).then(
	  function (zip) {
	    let lst=Object.entries(zip.files);
	    console.log(zip.files,lst);
	    for (let i=0;i<lst.length;++i){
	      let cur=lst[i];
	      let curname=cur[1].name;
	      console.log(curname);
	      zip.file(curname).async("arraybuffer").then(
		function(data){
		  exec=1;
		  for (let j=0;j<curname.length;++j){
		    if (curname[j]=='.'){
		      exec=0; break;
		    }
		  }
		  if (UI.tar_adddata(UI.numworks_buffer,curname,data,exec)==0){
		    alert(UI.langue==-1?'Pas d\'espace en memoire flash':'No space left in flash');
		    return;
		  }
		}
	      );
	    }
	  }
	);
	return;
      }
      for (let i=0;i<fname.length;++i){
	if (fname[i]=='.'){
	  exec=0; break;
	}
      }
      console.log(fname,exec);
      if (UI.tar_adddata(UI.numworks_buffer,file.name,evt.target.result,exec)==0)
	alert(UI.langue==-1?'Pas d\'espace en memoire flash':'No space left in flash');
    }
  },
  file_gettar:function(file){
    console.log(file);
    if (UI.numworks_buffer!=0){
      if (!confirm('Attention, la personnalisation courante va etre effacee! Continuer?'))
	return;
    }
    let reader = new FileReader();
    reader.onerror = function (evt) { }
    reader.readAsArrayBuffer(file);
    reader.onload = function(evt){
      UI.tar_first_modif_offset=0;
      UI.numworks_buffer=evt.target.result;
      console.log(UI.tar_fileinfo(UI.numworks_buffer,1));
    }
  },
  file_savetar:function(buffer,filename){
    let finfo=UI.tar_fileinfo(buffer,0);
    let s=finfo.length;
    if (s==0) return 0;
    let infoend=finfo[s-1];
    let end=infoend.header_offset+UI.tar_filesize(infoend.size);
    // add at least 1024 bytes, set them to 0
    let newsize=end+1024;  //newsize=10240*Math.ceil(newsize/10240);
    if (buffer.byteLength<newsize)
      buffer=UI.numworks_buffer=UI.arrayBufferTransfer(buffer,newsize);
    let view=new Uint8Array(buffer,0,newsize); 
    for (let i=end;i<newsize;++i)
      view[i]=0;
    let blob = new Blob([view], {type: "octet/stream"});
    saveAs(blob, filename);  
  },
  tar_savefile:function(filename){
    let buffer=UI.numworks_buffer;
    let finfo=UI.tar_fileinfo(buffer,0);
    let s=finfo.length;
    if (s==0) return 0;
    for (let i=0;i<s;++i){
      let cur=finfo[i];
      if (cur.name!=filename) continue;
      let view=new Uint8Array(cur.size);
      let offset=cur.header_offset+512;
      let buf=new Uint8Array(buffer);
      for (let j=0;j<cur.size;++j)
	view[j]=buf[offset+j];
      //console.log(cur,offset,view);
      let blob = new Blob([view], {type: "octet/stream"});
      saveAs(blob, filename);  
      return;
    }
  },
  numworks_gettar:function(calc){
    if (calc<=0){
      UI.numworks_gettar_(calc);
      return;
    }
    UI.calc=2;
    UI.nws_connect();
    window.setTimeout(UI.numworks_gettar_,100,calc);
  },
  numworks_gettar_:async function(calc){
    console.log(calc,UI.calculator);
    if (calc>0 && (UI.calculator==0 || !UI.calculator_connected)){
      alert(UI.langue==-1?UI.chkmsgfr:chkmsgen);
      if (UI.calculator) UI.calculator.stopAutoConnect();
      return;
    }
    if (UI.numworks_buffer!=0){
      if (!confirm('Attention, la personnalisation courante va etre effacee! Continuer?'))
	return;
    }
    UI.tar_first_modif_offset=0;
    if (calc==0)
      UI.numworks_buffer=await UI.loadfile('apps.tar');
    else if (calc==-1)
      UI.numworks_buffer=await UI.loadfile('appsalpha.tar');
    else if (calc==-2)
      UI.numworks_buffer=await UI.loadfile('khi92.tar');
    else
      UI.numworks_buffer=await UI.calculator.get_apps();
    let finfo=UI.tar_fileinfo(UI.numworks_buffer,1),s=finfo.length;
    if (calc>0 && s>0)
      UI.tar_first_modif_offset=finfo[s-1].header_offset+UI.tar_filesize(finfo[s-1].size);
    // window.setTimeout(UI.tar_fileinfo,1000,UI.numworks_buffer);
    //UI.print("Archive flash:\n"+UI.numworks_tarinfo(UI.numworks_buffer));
  },
  numworks_getarchive:function(filename,appendapps=1){
    // filename=string filename to archive or 0 or 1 for calculator upgrade
    UI.calc=2;
    UI.nws_connect();
    window.setTimeout(UI.numworks_getarchive_,100,filename,appendapps);
  },
  numworks_getarchive_:async function(filename,appendapps=1){
    let sendcalc= !(typeof filename=="string");
    if (sendcalc) appendapps=1;
    console.log(sendcalc,UI.calculator);
    if (UI.calculator==0 || !UI.calculator_connected){
      alert(UI.langue==-1?UI.chkmsgfr:chkmsgen);
      if (UI.calculator) UI.calculator.stopAutoConnect();
      return;
    }
    let buffer=await UI.calculator.get_apps();
    let appsbuffer;
    if (filename==1)
      appsbuffer=await UI.loadfile('appsalpha.tar');
    else
      appsbuffer=await UI.loadfile('apps.tar');
    let appsfinfo=UI.tar_fileinfo(appsbuffer);
    console.log('appsfinfo',appsfinfo);
    let resbuffer;
    if (appendapps)
      resbuffer=appsbuffer;
    else
      resbuffer=new Uint8Array().buffer;
    let finfo=UI.tar_fileinfo(buffer,0),l=finfo.length,L=appsfinfo.length;
    for (let i=0;i<l;++i){ 
      let cur=finfo[i];
      let name=cur.name,j;
      // check if name should be archived (not archived if it is in apps)
      for (j=0;j<L;++j){
	if (name==appsfinfo[j].name)
	  break;
      }
      console.log(name,j,L);
      if (j<L)
	continue;
      let size=cur.size;
      let offset=cur.header_offset+512;
      let data=new Uint8Array(buffer,offset,size);
      //console.log(data);
      resbuffer=UI.tar_adddata(resbuffer,name,data,0,0);
      // console.log('getarchive',i,UI.tar_fileinfo(resbuffer,0));
    }
    finfo=UI.tar_fileinfo(resbuffer,0);
    console.log(filename,finfo);
    //return;
    if (sendcalc){
      UI.calculator.device.startAddress = 0x90200000; // UI.appsaddress;
      UI.calculator.device.logProgress(0,'apps');
      let res=await UI.calculator.device.do_download(UI.calculator.transferSize, resbuffer, false);
      alert(UI.langue==-1?'Installation terminee. Appuyer sur RESET a l\'arriere de la calculatrice':'Install success. Press RESET on the calculator back.');
      return res;
    }
    else
      UI.file_savetar(resbuffer,filename);
  },
  numworks_sendtar:function(){
    UI.calc=2;
    UI.nws_connect();
    window.setTimeout(UI.numworks_sendtar_,100);
  },
  numworks_sendtar_:async function(){
    if (!UI.numworks_chk_buffer())
      return;
    if (!UI.calculator || !UI.calculator_connected){
      alert(UI.langue==-1?UI.chkmsgfr:chkmsgen);
      if (UI.calculator) UI.calculator.stopAutoConnect();
      return;
    }
    $id('perso').style.display='none';    
    if (UI.tar_first_modif_offset){
      let finfo=UI.tar_fileinfo(UI.numworks_buffer,0);
      let s=finfo.length;
      if (s==0) return;
      let start=65536*Math.floor(UI.tar_first_modif_offset/65536);
      let size=finfo[s-1].header_offset+UI.tar_filesize(finfo[s-1].size)-start;
      let buf=new Uint8Array(size);
      let src=new Uint8Array(UI.numworks_buffer);
      for (let i=0;i<size;++i)
	buf[i]=src[start+i];
      let buffer=buf.buffer;
      console.log('sendtar appstart 1st_modif start size buflength',UI.appsaddress.toString(16),UI.tar_first_modif_offset.toString(16),start.toString(16),size.toString(16),buffer.byteLength.toString(16));
      UI.calculator.device.startAddress = UI.appsaddress+start;
      UI.calculator.device.logProgress(0,'apps');
      // return;
      res=await UI.calculator.device.do_download(UI.calculator.transferSize, buffer, false);      
    }
    else {
      UI.calculator.device.startAddress = UI.appsaddress;//0x90200000; // 
      UI.calculator.device.logProgress(0,'apps');
      res=await UI.calculator.device.do_download(UI.calculator.transferSize, UI.numworks_buffer, false);
    }
    $id('perso').style.display='inline';    
    UI.print('apps OK, press RESET on calculator back');
  },
  numworks_certify:function(sigfile,rwcheck=false){
    $id('persoinit').style.display='none';
    UI.calc=2;
    UI.nws_connect();
    return new Promise(resolve => {
      window.setTimeout(() => resolve(UI.numworks_certify_(sigfile,rwcheck)),100);
    });
  },
  numworks_certify_:async function(sigfile,rwcheck){
    if (UI.calculator==0 || !UI.calculator_connected){
      alert(UI.langue==-1?UI.chkmsgfr:UI.chkmsgen);
      if (UI.calculator) UI.calculator.stopAutoConnect();
      return -1;
    }
    if (rwcheck)
      if (!confirm(UI.langue==-1?"Ce test necessite l'accord du proprietaire de la calculatrice, il dure environ 1 minute. Poursuivre?":'This test requires the calculator owner authorization. It will take about 1 minute. Perform?'))
	return -1;
    //else alert(UI.langue==-1?'Le test va prendre environ 20 secondes':'Test will take about 20 seconds');
    UI.print('========');
    let res;
    let external=await UI.calculator.get_external_flash(1);
    // now check if we have a kernel/userland
    let kern=UI.has_kernel_userland(external);
    console.log('kernel/userland',kern);
    if (kern){
      // check 0x90000000 slot A kernel/userland
      res=await UI.sig_check(sigfile,external,'epsilon.bin');
      let chk26 = res==1;
      if (!res){
        alert(UI.langue==-1?'Kernel/Userland slot A non certifiés.':'Kernel/Userland slot A not certified');
        return 2;
      }
      // ok, check full KhiCAS install at 0x90260000
      if (chk26){
        external=await UI.calculator.get_external_flash(0x26);
        res=await UI.sig_check(sigfile,external,'khi110a');
        if (!res){
          alert(UI.langue==-1?'KhiCAS app A non certifiée.':'KhiCAS app A not certified');
          return 2;
        }
      }
      external=await UI.calculator.get_external_flash(3);
      res=await UI.sig_check(sigfile,external,'khi110ab.tar');
      if (!res){
        alert(UI.langue==-1?'KhiCAS app B non certifiée.':'KhiCAS app B not certified');
        return 2;
      }
      if (rwcheck){
	// do random r/w starting at 0x1c0000
	UI.print('R/W check 0x901a00000');
	res=await UI.calculator.rw_check(0x901a0000,0xc0000);
	if (!res){
	  alert(UI.langue==-1?'Echec du test lecture/ecriture 0x901a0000':'Read/Write test failure 0x901a0000');
	  return 4;
	}
      }
      alert(UI.langue==-1?'Firmware certifie (externe et KhiCAS)':'Firmware certified (external and KhiCAS).');      
      return 0;
    }
    UI.adjust_exam_sector(external);
    res=await UI.sig_check(sigfile,external,'delta.external.bin');
    if (!res){
      alert(UI.langue==-1?'Flash externe slot 1 non certifiee. Cliquer sur installer KhiCAS pour installer un firmware certifie.':'External flash slot 1 not certified');
      return 2;
    }
    UI.print('External flash slot 1 OK');
    external=await UI.calculator.get_external_flash(2);
    UI.adjust_exam_sector(external);
    res=await UI.sig_check(sigfile,external,'khi.B.bin');
    if (!res){
      alert(UI.langue==-1?'Flash externe slot 2 non certifiee. Cliquer sur installer KhiCAS pour installer un firmware certifie.':'External flash slot 2 not certified');
      return 2;
    }
    UI.print('External flash slot 2 OK');
    let apps=await UI.calculator.get_apps();
    res=await UI.sig_check(sigfile,apps,'apps.tar');
    if (!res){
      alert(UI.langue==-1?'Applications non certifiees. Cliquer sur installer KhiCAS pour installer un firmware certifie.':'Applications not certified');
      return 3;
    }
    UI.print('Apps OK');
    if (rwcheck){
      if (0){
	UI.print('R/W check 0x91300000');
	res=await UI.calculator.rw_check(0x90130000,0xd0000);
	if (!res){
	  alert(UI.langue==-1?'Echec du test lecture/ecriture':'Read/Write test failure');
	  return 4;
	}
      }
      UI.print('R/W check 0x90740000');
      res=await UI.calculator.rw_check(0x90740000,0xa0000);
      if (!res){
	alert(UI.langue==-1?'Echec du test lecture/ecriture':'Read/Write test failure');
	return 4;
      }
      UI.print('R/W OK');
    }
    let pinfo = await UI.calculator.getPlatformInfo();
    if (pinfo["bootloader"]==0){
      let internal=await UI.calculator.get_internal_flash();
      //console.log(sigfile);
      res=await UI.sig_check(sigfile,internal,'delta.internal.bin');
      if (!res){
	alert(UI.langue==-1?'Flash interne non certifiee. Cliquer sur installer KhiCAS pour installer un firmware certifie.':'Internal flash not certified');
	return 1;
      }
      UI.print('Internal flash OK');
      alert(UI.langue==-1?'Firmware certifie (interne, externe et KhiCAS)':'Certified firmware (internal, external and KhiCAS)');
    }
    else
      alert(UI.langue==-1?'Firmware certifie (externe et KhiCAS). Pour certifier la flash interne, faire Reset et lancer KhiCAS.':'Firmware certified (external and KhiCAS). Reset the calculator and run KhiCAS to certify internal flash.');      
    return 0;
  },
  htmlbuffer:'',
  htmlcheck:true,
  print:function(text){
    let element = $id('output');
    //console.log(text.charCodeAt(0));
    if (text.length == 1 && text.charCodeAt(0) == 12) {
      element.innerHTML = '';
      return;
    }
    if (text.length >= 1 && text.charCodeAt(0) == 2) {
      console.log('STX');
      UI.htmlcheck = false;
      UI.htmlbuffer = '';
      return;
    }
    if (text.length >= 1 && text.charCodeAt(0) == 3) {
      console.log('ETX');
      UI.htmlcheck = true;
      element.style.display = 'inherit';
      element.innerHTML += UI.htmlbuffer;
      UI.htmlbuffer = '';
      element.scrollTop = 99999;
      return;
    }
    if (UI.htmlcheck) {
      // These replacements are necessary if you render to raw HTML
      text = '' + text;
      console.log(text);
      text = text.replace(/&/g, "&amp;");
      text = text.replace(/</g, "&lt;");
      text = text.replace(/>/g, "&gt;");
      text = text.replace(/\n/g, '<br>');
      text += '<br>';
      element.style.display = 'inherit';
      element.innerHTML += text; // element.value += text + "\n";
      element.scrollTop = 99999; // focus on bottom
    } else UI.htmlbuffer += text;
    element.scrollIntoView();
  },
};

