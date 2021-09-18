var FileTypes;
(function(FileTypes) {
    FileTypes[FileTypes["file"] = 0] = "file";
    FileTypes[FileTypes["link"] = 1] = "link";
    FileTypes[FileTypes["symlink"] = 2] = "symlink";
    FileTypes[FileTypes["character-device"] = 3] = "character-device";
    FileTypes[FileTypes["block-device"] = 4] = "block-device";
    FileTypes[FileTypes["directory"] = 5] = "directory";
    FileTypes[FileTypes["fifo"] = 6] = "fifo";
    FileTypes[FileTypes["contiguous-file"] = 7] = "contiguous-file";
})(FileTypes || (FileTypes = {
}));
var DiffType;
(function(DiffType) {
    DiffType["removed"] = "removed";
    DiffType["common"] = "common";
    DiffType["added"] = "added";
})(DiffType || (DiffType = {
}));
const message2 = {
    2: "need dictionary",
    1: "stream end",
    0: "",
    "-1": "file error",
    "-2": "stream error",
    "-3": "data error",
    "-4": "insufficient memory",
    "-5": "buffer error",
    "-6": "incompatible version"
};
function zero(buf) {
    buf.fill(0, 0, buf.length);
}
const L_CODES = 256 + 1 + 29;
const BL_CODES = 19;
const HEAP_SIZE = 2 * L_CODES + 1;
const Buf_size = 16;
const END_BLOCK = 256;
const extra_lbits = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0, 
];
const extra_dbits = [
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13, 
];
const bl_order = [
    16,
    17,
    18,
    0,
    8,
    7,
    9,
    6,
    10,
    5,
    11,
    4,
    12,
    3,
    13,
    2,
    14,
    1,
    15, 
];
const static_ltree = new Array((L_CODES + 2) * 2);
zero(static_ltree);
const static_dtree = new Array(30 * 2);
zero(static_dtree);
const _dist_code = new Array(512);
zero(_dist_code);
const _length_code = new Array(258 - 3 + 1);
zero(_length_code);
const base_length = new Array(29);
zero(base_length);
const base_dist = new Array(30);
zero(base_dist);
function d_code(dist) {
    return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
}
function put_short(s, w) {
    s.pending_buf[s.pending++] = w & 255;
    s.pending_buf[s.pending++] = w >>> 8 & 255;
}
function send_bits(s, value, length) {
    if (s.bi_valid > 16 - length) {
        s.bi_buf |= value << s.bi_valid & 65535;
        put_short(s, s.bi_buf);
        s.bi_buf = value >> Buf_size - s.bi_valid;
        s.bi_valid += length - Buf_size;
    } else {
        s.bi_buf |= value << s.bi_valid & 65535;
        s.bi_valid += length;
    }
}
function send_code(s, c, tree) {
    send_bits(s, tree[c * 2], tree[c * 2 + 1]);
}
function bi_reverse(code, len) {
    let res = 0;
    do {
        res |= code & 1;
        code >>>= 1;
        res <<= 1;
    }while (--len > 0)
    return res >>> 1;
}
function gen_bitlen(s, desc) {
    let tree = desc.dyn_tree;
    let max_code = desc.max_code;
    let stree = desc.stat_desc.static_tree;
    let has_stree = desc.stat_desc.has_stree;
    let extra = desc.stat_desc.extra_bits;
    let base = desc.stat_desc.extra_base;
    let max_length = desc.stat_desc.max_length;
    let h;
    let n, m;
    let bits;
    let xbits;
    let f;
    let overflow = 0;
    for(bits = 0; bits <= 15; bits++){
        s.bl_count[bits] = 0;
    }
    tree[s.heap[s.heap_max] * 2 + 1] = 0;
    for(h = s.heap_max + 1; h < HEAP_SIZE; h++){
        n = s.heap[h];
        bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
        if (bits > max_length) {
            bits = max_length;
            overflow++;
        }
        tree[n * 2 + 1] = bits;
        if (n > max_code) continue;
        s.bl_count[bits]++;
        xbits = 0;
        if (n >= base) {
            xbits = extra[n - base];
        }
        f = tree[n * 2];
        s.opt_len += f * (bits + xbits);
        if (has_stree) {
            s.static_len += f * (stree[n * 2 + 1] + xbits);
        }
    }
    if (overflow === 0) return;
    do {
        bits = max_length - 1;
        while(s.bl_count[bits] === 0)bits--;
        s.bl_count[bits]--;
        s.bl_count[bits + 1] += 2;
        s.bl_count[max_length]--;
        overflow -= 2;
    }while (overflow > 0)
    for(bits = max_length; bits !== 0; bits--){
        n = s.bl_count[bits];
        while(n !== 0){
            m = s.heap[--h];
            if (m > max_code) continue;
            if (tree[m * 2 + 1] !== bits) {
                s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
                tree[m * 2 + 1] = bits;
            }
            n--;
        }
    }
}
function gen_codes(tree, max_code, bl_count) {
    let next_code = new Array(15 + 1);
    let code = 0;
    let bits;
    let n;
    for(bits = 1; bits <= 15; bits++){
        next_code[bits] = code = code + bl_count[bits - 1] << 1;
    }
    for(n = 0; n <= max_code; n++){
        let len = tree[n * 2 + 1];
        if (len === 0) continue;
        tree[n * 2] = bi_reverse(next_code[len]++, len);
    }
}
function init_block(s) {
    let n;
    for(n = 0; n < L_CODES; n++)s.dyn_ltree[n * 2] = 0;
    for(n = 0; n < 30; n++)s.dyn_dtree[n * 2] = 0;
    for(n = 0; n < 19; n++)s.bl_tree[n * 2] = 0;
    s.dyn_ltree[END_BLOCK * 2] = 1;
    s.opt_len = s.static_len = 0;
    s.last_lit = s.matches = 0;
}
function bi_windup(s) {
    if (s.bi_valid > 8) {
        put_short(s, s.bi_buf);
    } else if (s.bi_valid > 0) {
        s.pending_buf[s.pending++] = s.bi_buf;
    }
    s.bi_buf = 0;
    s.bi_valid = 0;
}
function copy_block(s, buf, len, header) {
    bi_windup(s);
    if (header) {
        put_short(s, len);
        put_short(s, ~len);
    }
    s.pending_buf.set(s.window.subarray(buf, buf + len), s.pending);
    s.pending += len;
}
function smaller(tree, n, m, depth) {
    let _n2 = n * 2;
    let _m2 = m * 2;
    return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
}
function pqdownheap(s, tree, k) {
    let v = s.heap[k];
    let j = k << 1;
    while(j <= s.heap_len){
        if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
            j++;
        }
        if (smaller(tree, v, s.heap[j], s.depth)) break;
        s.heap[k] = s.heap[j];
        k = j;
        j <<= 1;
    }
    s.heap[k] = v;
}
function compress_block(s, ltree, dtree) {
    let dist;
    let lc;
    let lx = 0;
    let code;
    let extra;
    if (s.last_lit !== 0) {
        do {
            dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
            lc = s.pending_buf[s.l_buf + lx];
            lx++;
            if (dist === 0) {
                send_code(s, lc, ltree);
            } else {
                code = _length_code[lc];
                send_code(s, code + 256 + 1, ltree);
                extra = extra_lbits[code];
                if (extra !== 0) {
                    lc -= base_length[code];
                    send_bits(s, lc, extra);
                }
                dist--;
                code = d_code(dist);
                send_code(s, code, dtree);
                extra = extra_dbits[code];
                if (extra !== 0) {
                    dist -= base_dist[code];
                    send_bits(s, dist, extra);
                }
            }
        }while (lx < s.last_lit)
    }
    send_code(s, 256, ltree);
}
function build_tree(s, desc) {
    let tree = desc.dyn_tree;
    let stree = desc.stat_desc.static_tree;
    let has_stree = desc.stat_desc.has_stree;
    let elems = desc.stat_desc.elems;
    let n, m;
    let max_code = -1;
    let node;
    s.heap_len = 0;
    s.heap_max = HEAP_SIZE;
    for(n = 0; n < elems; n++){
        if (tree[n * 2] !== 0) {
            s.heap[++s.heap_len] = max_code = n;
            s.depth[n] = 0;
        } else {
            tree[n * 2 + 1] = 0;
        }
    }
    while(s.heap_len < 2){
        node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
        tree[node * 2] = 1;
        s.depth[node] = 0;
        s.opt_len--;
        if (has_stree) {
            s.static_len -= stree[node * 2 + 1];
        }
    }
    desc.max_code = max_code;
    for(n = s.heap_len >> 1; n >= 1; n--)pqdownheap(s, tree, n);
    node = elems;
    do {
        n = s.heap[1];
        s.heap[1] = s.heap[s.heap_len--];
        pqdownheap(s, tree, 1);
        m = s.heap[1];
        s.heap[--s.heap_max] = n;
        s.heap[--s.heap_max] = m;
        tree[node * 2] = tree[n * 2] + tree[m * 2];
        s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
        tree[n * 2 + 1] = tree[m * 2 + 1] = node;
        s.heap[1] = node++;
        pqdownheap(s, tree, 1);
    }while (s.heap_len >= 2)
    s.heap[--s.heap_max] = s.heap[1];
    gen_bitlen(s, desc);
    gen_codes(tree, max_code, s.bl_count);
}
function scan_tree(s, tree, max_code) {
    let n;
    let prevlen = -1;
    let curlen;
    let nextlen = tree[0 * 2 + 1];
    let count = 0;
    let max_count = 7;
    let min_count = 4;
    if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
    }
    tree[(max_code + 1) * 2 + 1] = 65535;
    for(n = 0; n <= max_code; n++){
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1];
        if (++count < max_count && curlen === nextlen) {
            continue;
        } else if (count < min_count) {
            s.bl_tree[curlen * 2] += count;
        } else if (curlen !== 0) {
            if (curlen !== prevlen) s.bl_tree[curlen * 2]++;
            s.bl_tree[16 * 2]++;
        } else if (count <= 10) {
            s.bl_tree[17 * 2]++;
        } else {
            s.bl_tree[18 * 2]++;
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
        } else if (curlen === nextlen) {
            max_count = 6;
            min_count = 3;
        } else {
            max_count = 7;
            min_count = 4;
        }
    }
}
function send_tree(s, tree, max_code) {
    let n;
    let prevlen = -1;
    let curlen;
    let nextlen = tree[0 * 2 + 1];
    let count = 0;
    let max_count = 7;
    let min_count = 4;
    if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
    }
    for(n = 0; n <= max_code; n++){
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1];
        if (++count < max_count && curlen === nextlen) {
            continue;
        } else if (count < min_count) {
            do {
                send_code(s, curlen, s.bl_tree);
            }while (--count !== 0)
        } else if (curlen !== 0) {
            if (curlen !== prevlen) {
                send_code(s, curlen, s.bl_tree);
                count--;
            }
            send_code(s, 16, s.bl_tree);
            send_bits(s, count - 3, 2);
        } else if (count <= 10) {
            send_code(s, 17, s.bl_tree);
            send_bits(s, count - 3, 3);
        } else {
            send_code(s, 18, s.bl_tree);
            send_bits(s, count - 11, 7);
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
        } else if (curlen === nextlen) {
            max_count = 6;
            min_count = 3;
        } else {
            max_count = 7;
            min_count = 4;
        }
    }
}
function build_bl_tree(s) {
    let max_blindex;
    scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
    scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
    build_tree(s, s.bl_desc);
    for(max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--){
        if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
            break;
        }
    }
    s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
    return max_blindex;
}
function send_all_trees(s, lcodes, dcodes, blcodes) {
    let rank;
    send_bits(s, lcodes - 257, 5);
    send_bits(s, dcodes - 1, 5);
    send_bits(s, blcodes - 4, 4);
    for(rank = 0; rank < blcodes; rank++){
        send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
    }
    send_tree(s, s.dyn_ltree, lcodes - 1);
    send_tree(s, s.dyn_dtree, dcodes - 1);
}
function detect_data_type(s) {
    let black_mask = 4093624447;
    let n;
    for(n = 0; n <= 31; n++, black_mask >>>= 1){
        if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
            return 0;
        }
    }
    if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
        return 1;
    }
    for(n = 32; n < 256; n++){
        if (s.dyn_ltree[n * 2] !== 0) {
            return 1;
        }
    }
    return 0;
}
function _tr_stored_block(s, buf, stored_len, last) {
    send_bits(s, (0 << 1) + (last ? 1 : 0), 3);
    copy_block(s, buf, stored_len, true);
}
function _tr_flush_block(s, buf, stored_len, last) {
    let opt_lenb, static_lenb;
    let max_blindex = 0;
    if (s.level > 0) {
        if (s.strm.data_type === 2) {
            s.strm.data_type = detect_data_type(s);
        }
        build_tree(s, s.l_desc);
        build_tree(s, s.d_desc);
        max_blindex = build_bl_tree(s);
        opt_lenb = s.opt_len + 3 + 7 >>> 3;
        static_lenb = s.static_len + 3 + 7 >>> 3;
        if (static_lenb <= opt_lenb) opt_lenb = static_lenb;
    } else {
        opt_lenb = static_lenb = stored_len + 5;
    }
    if (stored_len + 4 <= opt_lenb && buf !== -1) {
        _tr_stored_block(s, buf, stored_len, last);
    } else if (s.strategy === 4 || static_lenb === opt_lenb) {
        send_bits(s, (1 << 1) + (last ? 1 : 0), 3);
        compress_block(s, static_ltree, static_dtree);
    } else {
        send_bits(s, (2 << 1) + (last ? 1 : 0), 3);
        send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
        compress_block(s, s.dyn_ltree, s.dyn_dtree);
    }
    init_block(s);
    if (last) {
        bi_windup(s);
    }
}
function _tr_tally(s, dist, lc) {
    s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
    s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
    s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
    s.last_lit++;
    if (dist === 0) {
        s.dyn_ltree[lc * 2]++;
    } else {
        s.matches++;
        dist--;
        s.dyn_ltree[(_length_code[lc] + 256 + 1) * 2]++;
        s.dyn_dtree[d_code(dist) * 2]++;
    }
    return s.last_lit === s.lit_bufsize - 1;
}
function adler32(adler, buf, len, pos) {
    let s1 = adler & 65535 | 0;
    let s2 = adler >>> 16 & 65535 | 0;
    let n = 0;
    while(len !== 0){
        n = len > 2000 ? 2000 : len;
        len -= n;
        do {
            s1 = s1 + buf[pos++] | 0;
            s2 = s2 + s1 | 0;
        }while (--n)
        s1 %= 65521;
        s2 %= 65521;
    }
    return s1 | s2 << 16 | 0;
}
function makeTable() {
    let c;
    const table = [];
    const m = 3988292384;
    for(let n = 0; n < 256; n++){
        c = n;
        for(let k = 0; k < 8; k++){
            c = c & 1 ? m ^ c >>> 1 : c >>> 1;
        }
        table[n] = c;
    }
    return table;
}
const crcTable = makeTable();
function crc32(crc, buf, len, pos) {
    let t = crcTable;
    let end = pos + len;
    let f = 255;
    crc ^= -1;
    for(let i = pos; i < end; i++){
        crc = crc >>> 8 ^ t[(crc ^ buf[i]) & f];
    }
    return crc ^ -1;
}
var STATUS;
(function(STATUS) {
    STATUS[STATUS["Z_NO_FLUSH"] = 0] = "Z_NO_FLUSH";
    STATUS[STATUS["Z_PARTIAL_FLUSH"] = 1] = "Z_PARTIAL_FLUSH";
    STATUS[STATUS["Z_SYNC_FLUSH"] = 2] = "Z_SYNC_FLUSH";
    STATUS[STATUS["Z_FULL_FLUSH"] = 3] = "Z_FULL_FLUSH";
    STATUS[STATUS["Z_FINISH"] = 4] = "Z_FINISH";
    STATUS[STATUS["Z_BLOCK"] = 5] = "Z_BLOCK";
    STATUS[STATUS["Z_TREES"] = 6] = "Z_TREES";
    STATUS[STATUS["Z_OK"] = 0] = "Z_OK";
    STATUS[STATUS["Z_STREAM_END"] = 1] = "Z_STREAM_END";
    STATUS[STATUS["Z_NEED_DICT"] = 2] = "Z_NEED_DICT";
    STATUS[STATUS["Z_ERRNO"] = -1] = "Z_ERRNO";
    STATUS[STATUS["Z_STREAM_ERROR"] = -2] = "Z_STREAM_ERROR";
    STATUS[STATUS["Z_DATA_ERROR"] = -3] = "Z_DATA_ERROR";
    STATUS[STATUS["Z_BUF_ERROR"] = -5] = "Z_BUF_ERROR";
    STATUS[STATUS["Z_NO_COMPRESSION"] = 0] = "Z_NO_COMPRESSION";
    STATUS[STATUS["Z_BEST_SPEED"] = 1] = "Z_BEST_SPEED";
    STATUS[STATUS["Z_BEST_COMPRESSION"] = 9] = "Z_BEST_COMPRESSION";
    STATUS[STATUS["Z_DEFAULT_COMPRESSION"] = -1] = "Z_DEFAULT_COMPRESSION";
    STATUS[STATUS["Z_FILTERED"] = 1] = "Z_FILTERED";
    STATUS[STATUS["Z_HUFFMAN_ONLY"] = 2] = "Z_HUFFMAN_ONLY";
    STATUS[STATUS["Z_RLE"] = 3] = "Z_RLE";
    STATUS[STATUS["Z_FIXED"] = 4] = "Z_FIXED";
    STATUS[STATUS["Z_DEFAULT_STRATEGY"] = 0] = "Z_DEFAULT_STRATEGY";
    STATUS[STATUS["Z_BINARY"] = 0] = "Z_BINARY";
    STATUS[STATUS["Z_TEXT"] = 1] = "Z_TEXT";
    STATUS[STATUS["Z_UNKNOWN"] = 2] = "Z_UNKNOWN";
    STATUS[STATUS["Z_DEFLATED"] = 8] = "Z_DEFLATED";
})(STATUS || (STATUS = {
}));
const MIN_MATCH = 3;
const MAX_MATCH = 258;
const MIN_LOOKAHEAD = 258 + 3 + 1;
function flush_pending(strm) {
    let s = strm.state;
    let len = s.pending;
    if (len > strm.avail_out) {
        len = strm.avail_out;
    }
    if (len === 0) return;
    strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
    strm.next_out += len;
    s.pending_out += len;
    strm.total_out += len;
    strm.avail_out -= len;
    s.pending -= len;
    if (s.pending === 0) {
        s.pending_out = 0;
    }
}
function flush_block_only(s, last) {
    _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
    s.block_start = s.strstart;
    flush_pending(s.strm);
}
function read_buf(strm, buf, start, size) {
    let len = strm.avail_in;
    if (len > size) len = size;
    if (len === 0) return 0;
    strm.avail_in -= len;
    buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
    if (strm.state.wrap === 1) {
        strm.adler = adler32(strm.adler, buf, len, start);
    } else if (strm.state.wrap === 2) {
        strm.adler = crc32(strm.adler, buf, len, start);
    }
    strm.next_in += len;
    strm.total_in += len;
    return len;
}
function longest_match(s, cur_match) {
    let chain_length = s.max_chain_length;
    let scan = s.strstart;
    let match;
    let len;
    let best_len = s.prev_length;
    let nice_match = s.nice_match;
    let limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
    let _win = s.window;
    let wmask = s.w_mask;
    let prev = s.prev;
    let strend = s.strstart + 258;
    let scan_end1 = _win[scan + best_len - 1];
    let scan_end = _win[scan + best_len];
    if (s.prev_length >= s.good_match) {
        chain_length >>= 2;
    }
    if (nice_match > s.lookahead) nice_match = s.lookahead;
    do {
        match = cur_match;
        if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
            continue;
        }
        scan += 2;
        match++;
        do {
        }while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend)
        len = MAX_MATCH - (strend - scan);
        scan = strend - MAX_MATCH;
        if (len > best_len) {
            s.match_start = cur_match;
            best_len = len;
            if (len >= nice_match) {
                break;
            }
            scan_end1 = _win[scan + best_len - 1];
            scan_end = _win[scan + best_len];
        }
    }while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0)
    if (best_len <= s.lookahead) {
        return best_len;
    }
    return s.lookahead;
}
function fill_window(s) {
    let _w_size = s.w_size;
    let p, n, m, more, str;
    do {
        more = s.window_size - s.lookahead - s.strstart;
        if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
            s.window.set(s.window.subarray(_w_size, _w_size + _w_size), 0);
            s.match_start -= _w_size;
            s.strstart -= _w_size;
            s.block_start -= _w_size;
            n = s.hash_size;
            p = n;
            do {
                m = s.head[--p];
                s.head[p] = m >= _w_size ? m - _w_size : 0;
            }while (--n)
            n = _w_size;
            p = n;
            do {
                m = s.prev[--p];
                s.prev[p] = m >= _w_size ? m - _w_size : 0;
            }while (--n)
            more += _w_size;
        }
        if (s.strm.avail_in === 0) {
            break;
        }
        n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
        s.lookahead += n;
        if (s.lookahead + s.insert >= 3) {
            str = s.strstart - s.insert;
            s.ins_h = s.window[str];
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask;
            while(s.insert){
                s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
                s.prev[str & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = str;
                str++;
                s.insert--;
                if (s.lookahead + s.insert < 3) {
                    break;
                }
            }
        }
    }while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0)
}
function deflate_stored(s, flush) {
    let max_block_size = 65535;
    if (max_block_size > s.pending_buf_size - 5) {
        max_block_size = s.pending_buf_size - 5;
    }
    for(;;){
        if (s.lookahead <= 1) {
            fill_window(s);
            if (s.lookahead === 0 && flush === STATUS.Z_NO_FLUSH) {
                return 1;
            }
            if (s.lookahead === 0) {
                break;
            }
        }
        s.strstart += s.lookahead;
        s.lookahead = 0;
        let max_start = s.block_start + max_block_size;
        if (s.strstart === 0 || s.strstart >= max_start) {
            s.lookahead = s.strstart - max_start;
            s.strstart = max_start;
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
                return 1;
            }
        }
        if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
                return 1;
            }
        }
    }
    s.insert = 0;
    if (flush === STATUS.Z_FINISH) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
            return 3;
        }
        return 4;
    }
    if (s.strstart > s.block_start) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
            return 1;
        }
    }
    return 1;
}
function deflate_fast(s, flush) {
    let hash_head;
    let bflush;
    for(;;){
        if (s.lookahead < MIN_LOOKAHEAD) {
            fill_window(s);
            if (s.lookahead < MIN_LOOKAHEAD && flush === STATUS.Z_NO_FLUSH) {
                return 1;
            }
            if (s.lookahead === 0) {
                break;
            }
        }
        hash_head = 0;
        if (s.lookahead >= 3) {
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
        }
        if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
            s.match_length = longest_match(s, hash_head);
        }
        if (s.match_length >= 3) {
            bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
            s.lookahead -= s.match_length;
            if (s.match_length <= s.max_lazy_match && s.lookahead >= 3) {
                s.match_length--;
                do {
                    s.strstart++;
                    s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                    hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                    s.head[s.ins_h] = s.strstart;
                }while (--s.match_length !== 0)
                s.strstart++;
            } else {
                s.strstart += s.match_length;
                s.match_length = 0;
                s.ins_h = s.window[s.strstart];
                s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask;
            }
        } else {
            bflush = _tr_tally(s, 0, s.window[s.strstart]);
            s.lookahead--;
            s.strstart++;
        }
        if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
                return 1;
            }
        }
    }
    s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
    if (flush === STATUS.Z_FINISH) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
            return 3;
        }
        return 4;
    }
    if (s.last_lit) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
            return 1;
        }
    }
    return 2;
}
function deflate_slow(s, flush) {
    let hash_head;
    let bflush;
    let max_insert;
    for(;;){
        if (s.lookahead < MIN_LOOKAHEAD) {
            fill_window(s);
            if (s.lookahead < MIN_LOOKAHEAD && flush === STATUS.Z_NO_FLUSH) {
                return 1;
            }
            if (s.lookahead === 0) break;
        }
        hash_head = 0;
        if (s.lookahead >= 3) {
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
        }
        s.prev_length = s.match_length;
        s.prev_match = s.match_start;
        s.match_length = MIN_MATCH - 1;
        if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
            s.match_length = longest_match(s, hash_head);
            if (s.match_length <= 5 && (s.strategy === 1 || s.match_length === 3 && s.strstart - s.match_start > 4096)) {
                s.match_length = MIN_MATCH - 1;
            }
        }
        if (s.prev_length >= 3 && s.match_length <= s.prev_length) {
            max_insert = s.strstart + s.lookahead - MIN_MATCH;
            bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
            s.lookahead -= s.prev_length - 1;
            s.prev_length -= 2;
            do {
                if (++s.strstart <= max_insert) {
                    s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                    hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                    s.head[s.ins_h] = s.strstart;
                }
            }while (--s.prev_length !== 0)
            s.match_available = 0;
            s.match_length = MIN_MATCH - 1;
            s.strstart++;
            if (bflush) {
                flush_block_only(s, false);
                if (s.strm.avail_out === 0) {
                    return 1;
                }
            }
        } else if (s.match_available) {
            bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
            if (bflush) {
                flush_block_only(s, false);
            }
            s.strstart++;
            s.lookahead--;
            if (s.strm.avail_out === 0) {
                return 1;
            }
        } else {
            s.match_available = 1;
            s.strstart++;
            s.lookahead--;
        }
    }
    if (s.match_available) {
        bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
        s.match_available = 0;
    }
    s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
    if (flush === STATUS.Z_FINISH) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
            return 3;
        }
        return 4;
    }
    if (s.last_lit) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
            return 1;
        }
    }
    return 2;
}
class Config {
    good_length;
    max_lazy;
    nice_length;
    max_chain;
    func;
    constructor(good_length1, max_lazy1, nice_length1, max_chain1, func1){
        this.good_length = good_length1;
        this.max_lazy = max_lazy1;
        this.nice_length = nice_length1;
        this.max_chain = max_chain1;
        this.func = func1;
    }
}
let configuration_table;
configuration_table = [
    new Config(0, 0, 0, 0, deflate_stored),
    new Config(4, 4, 8, 4, deflate_fast),
    new Config(4, 5, 16, 8, deflate_fast),
    new Config(4, 6, 32, 32, deflate_fast),
    new Config(4, 4, 16, 16, deflate_slow),
    new Config(8, 16, 32, 32, deflate_slow),
    new Config(8, 16, 128, 128, deflate_slow),
    new Config(8, 32, 128, 256, deflate_slow),
    new Config(32, 128, 258, 1024, deflate_slow),
    new Config(32, 258, 258, 4096, deflate_slow)
];
function concatUint8Array(arr) {
    const length = arr.reduce((pre, next)=>pre + next.length
    , 0);
    const result = new Uint8Array(length);
    let offset = 0;
    for (const v of arr){
        result.set(v, offset);
        offset += v.length;
    }
    return result;
}
class ZStream {
    input = null;
    next_in = 0;
    avail_in = 0;
    total_in = 0;
    output = null;
    next_out = 0;
    avail_out = 0;
    total_out = 0;
    msg = "";
    state = null;
    data_type = 2;
    adler = 0;
}
const BAD = 30;
const TYPE = 12;
function inflate_fast(strm, start) {
    let state;
    let _in;
    let last;
    let _out;
    let beg;
    let end;
    let dmax;
    let wsize;
    let whave;
    let wnext;
    let s_window;
    let hold;
    let bits;
    let lcode;
    let dcode;
    let lmask;
    let dmask;
    let here;
    let op;
    let len;
    let dist;
    let from;
    let from_source;
    let input, output;
    state = strm.state;
    _in = strm.next_in;
    input = strm.input;
    last = _in + (strm.avail_in - 5);
    _out = strm.next_out;
    output = strm.output;
    beg = _out - (start - strm.avail_out);
    end = _out + (strm.avail_out - 257);
    dmax = state.dmax;
    wsize = state.wsize;
    whave = state.whave;
    wnext = state.wnext;
    s_window = state.window;
    hold = state.hold;
    bits = state.bits;
    lcode = state.lencode;
    dcode = state.distcode;
    lmask = (1 << state.lenbits) - 1;
    dmask = (1 << state.distbits) - 1;
    top: do {
        if (bits < 15) {
            hold += input[_in++] << bits;
            bits += 8;
            hold += input[_in++] << bits;
            bits += 8;
        }
        here = lcode[hold & lmask];
        dolen: for(;;){
            op = here >>> 24;
            hold >>>= op;
            bits -= op;
            op = here >>> 16 & 255;
            if (op === 0) {
                output[_out++] = here & 65535;
            } else if (op & 16) {
                len = here & 65535;
                op &= 15;
                if (op) {
                    if (bits < op) {
                        hold += input[_in++] << bits;
                        bits += 8;
                    }
                    len += hold & (1 << op) - 1;
                    hold >>>= op;
                    bits -= op;
                }
                if (bits < 15) {
                    hold += input[_in++] << bits;
                    bits += 8;
                    hold += input[_in++] << bits;
                    bits += 8;
                }
                here = dcode[hold & dmask];
                dodist: for(;;){
                    op = here >>> 24;
                    hold >>>= op;
                    bits -= op;
                    op = here >>> 16 & 255;
                    if (op & 16) {
                        dist = here & 65535;
                        op &= 15;
                        if (bits < op) {
                            hold += input[_in++] << bits;
                            bits += 8;
                            if (bits < op) {
                                hold += input[_in++] << bits;
                                bits += 8;
                            }
                        }
                        dist += hold & (1 << op) - 1;
                        if (dist > dmax) {
                            strm.msg = "invalid distance too far back";
                            state.mode = BAD;
                            break top;
                        }
                        hold >>>= op;
                        bits -= op;
                        op = _out - beg;
                        if (dist > op) {
                            op = dist - op;
                            if (op > whave) {
                                if (state.sane) {
                                    strm.msg = "invalid distance too far back";
                                    state.mode = BAD;
                                    break top;
                                }
                            }
                            from = 0;
                            from_source = s_window;
                            if (wnext === 0) {
                                from += wsize - op;
                                if (op < len) {
                                    len -= op;
                                    do {
                                        output[_out++] = s_window[from++];
                                    }while (--op)
                                    from = _out - dist;
                                    from_source = output;
                                }
                            } else if (wnext < op) {
                                from += wsize + wnext - op;
                                op -= wnext;
                                if (op < len) {
                                    len -= op;
                                    do {
                                        output[_out++] = s_window[from++];
                                    }while (--op)
                                    from = 0;
                                    if (wnext < len) {
                                        op = wnext;
                                        len -= op;
                                        do {
                                            output[_out++] = s_window[from++];
                                        }while (--op)
                                        from = _out - dist;
                                        from_source = output;
                                    }
                                }
                            } else {
                                from += wnext - op;
                                if (op < len) {
                                    len -= op;
                                    do {
                                        output[_out++] = s_window[from++];
                                    }while (--op)
                                    from = _out - dist;
                                    from_source = output;
                                }
                            }
                            while(len > 2){
                                output[_out++] = from_source[from++];
                                output[_out++] = from_source[from++];
                                output[_out++] = from_source[from++];
                                len -= 3;
                            }
                            if (len) {
                                output[_out++] = from_source[from++];
                                if (len > 1) {
                                    output[_out++] = from_source[from++];
                                }
                            }
                        } else {
                            from = _out - dist;
                            do {
                                output[_out++] = output[from++];
                                output[_out++] = output[from++];
                                output[_out++] = output[from++];
                                len -= 3;
                            }while (len > 2)
                            if (len) {
                                output[_out++] = output[from++];
                                if (len > 1) {
                                    output[_out++] = output[from++];
                                }
                            }
                        }
                    } else if ((op & 64) === 0) {
                        here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                        continue dodist;
                    } else {
                        strm.msg = "invalid distance code";
                        state.mode = BAD;
                        break top;
                    }
                    break;
                }
            } else if ((op & 64) === 0) {
                here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
                continue dolen;
            } else if (op & 32) {
                state.mode = TYPE;
                break top;
            } else {
                strm.msg = "invalid literal/length code";
                state.mode = BAD;
                break top;
            }
            break;
        }
    }while (_in < last && _out < end)
    len = bits >> 3;
    _in -= len;
    bits -= len << 3;
    hold &= (1 << bits) - 1;
    strm.next_in = _in;
    strm.next_out = _out;
    strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
    strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
    state.hold = hold;
    state.bits = bits;
    return;
}
const MAXBITS = 15;
const lbase = [
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    13,
    15,
    17,
    19,
    23,
    27,
    31,
    35,
    43,
    51,
    59,
    67,
    83,
    99,
    115,
    131,
    163,
    195,
    227,
    258,
    0,
    0, 
];
const lext = [
    16,
    16,
    16,
    16,
    16,
    16,
    16,
    16,
    17,
    17,
    17,
    17,
    18,
    18,
    18,
    18,
    19,
    19,
    19,
    19,
    20,
    20,
    20,
    20,
    21,
    21,
    21,
    21,
    16,
    72,
    78, 
];
const dbase = [
    1,
    2,
    3,
    4,
    5,
    7,
    9,
    13,
    17,
    25,
    33,
    49,
    65,
    97,
    129,
    193,
    257,
    385,
    513,
    769,
    1025,
    1537,
    2049,
    3073,
    4097,
    6145,
    8193,
    12289,
    16385,
    24577,
    0,
    0, 
];
const dext = [
    16,
    16,
    16,
    16,
    17,
    17,
    18,
    18,
    19,
    19,
    20,
    20,
    21,
    21,
    22,
    22,
    23,
    23,
    24,
    24,
    25,
    25,
    26,
    26,
    27,
    27,
    28,
    28,
    29,
    29,
    64,
    64, 
];
function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
    let bits = opts.bits;
    let len = 0;
    let sym = 0;
    let min = 0, max = 0;
    let root = 0;
    let curr = 0;
    let drop = 0;
    let left = 0;
    let used = 0;
    let huff = 0;
    let incr;
    let fill;
    let low;
    let mask;
    let next;
    let base = null;
    let base_index = 0;
    let end;
    let count = new Uint16Array(15 + 1);
    let offs = new Uint16Array(15 + 1);
    let extra = null;
    let extra_index = 0;
    let here_bits, here_op, here_val;
    for(len = 0; len <= 15; len++){
        count[len] = 0;
    }
    for(sym = 0; sym < codes; sym++){
        count[lens[lens_index + sym]]++;
    }
    root = bits;
    for(max = MAXBITS; max >= 1; max--){
        if (count[max] !== 0) break;
    }
    if (root > max) {
        root = max;
    }
    if (max === 0) {
        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        opts.bits = 1;
        return 0;
    }
    for(min = 1; min < max; min++){
        if (count[min] !== 0) break;
    }
    if (root < min) {
        root = min;
    }
    left = 1;
    for(len = 1; len <= 15; len++){
        left <<= 1;
        left -= count[len];
        if (left < 0) {
            return -1;
        }
    }
    if (left > 0 && (type === 0 || max !== 1)) {
        return -1;
    }
    offs[1] = 0;
    for(len = 1; len < 15; len++){
        offs[len + 1] = offs[len] + count[len];
    }
    for(sym = 0; sym < codes; sym++){
        if (lens[lens_index + sym] !== 0) {
            work[offs[lens[lens_index + sym]]++] = sym;
        }
    }
    if (type === 0) {
        base = extra = work;
        end = 19;
    } else if (type === 1) {
        base = lbase;
        base_index -= 257;
        extra = lext;
        extra_index -= 257;
        end = 256;
    } else {
        base = dbase;
        extra = dext;
        end = -1;
    }
    huff = 0;
    sym = 0;
    len = min;
    next = table_index;
    curr = root;
    drop = 0;
    low = -1;
    used = 1 << root;
    mask = used - 1;
    if (type === 1 && used > 852 || type === 2 && used > 592) {
        return 1;
    }
    for(;;){
        here_bits = len - drop;
        if (work[sym] < end) {
            here_op = 0;
            here_val = work[sym];
        } else if (work[sym] > end) {
            here_op = extra[extra_index + work[sym]];
            here_val = base[base_index + work[sym]];
        } else {
            here_op = 32 + 64;
            here_val = 0;
        }
        incr = 1 << len - drop;
        fill = 1 << curr;
        min = fill;
        do {
            fill -= incr;
            table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
        }while (fill !== 0)
        incr = 1 << len - 1;
        while(huff & incr){
            incr >>= 1;
        }
        if (incr !== 0) {
            huff &= incr - 1;
            huff += incr;
        } else {
            huff = 0;
        }
        sym++;
        if (--count[len] === 0) {
            if (len === max) break;
            len = lens[lens_index + work[sym]];
        }
        if (len > root && (huff & mask) !== low) {
            if (drop === 0) {
                drop = root;
            }
            next += min;
            curr = len - drop;
            left = 1 << curr;
            while(curr + drop < max){
                left -= count[curr + drop];
                if (left <= 0) break;
                curr++;
                left <<= 1;
            }
            used += 1 << curr;
            if (type === 1 && used > 852 || type === 2 && used > 592) {
                return 1;
            }
            low = huff & mask;
            table[low] = root << 24 | curr << 16 | next - table_index | 0;
        }
    }
    if (huff !== 0) {
        table[next + huff] = len - drop << 24 | 64 << 16 | 0;
    }
    opts.bits = root;
    return 0;
}
const CODES = 0;
const LENS = 1;
const DISTS = 2;
const Z_OK = 0;
const Z_STREAM_END = 1;
const Z_STREAM_ERROR1 = -2;
const Z_DATA_ERROR = -3;
const Z_MEM_ERROR = -4;
const Z_BUF_ERROR = -5;
const HEAD = 1;
const FLAGS = 2;
const TIME = 3;
const OS = 4;
const EXLEN = 5;
const EXTRA = 6;
const NAME = 7;
const COMMENT = 8;
const HCRC = 9;
const DICTID = 10;
const DICT = 11;
const TYPE1 = 12;
const TYPEDO = 13;
const STORED = 14;
const COPY_ = 15;
const COPY = 16;
const TABLE = 17;
const LENLENS = 18;
const CODELENS = 19;
const LEN_ = 20;
const LEN = 21;
const LENEXT = 22;
const DIST = 23;
const DISTEXT = 24;
const MATCH = 25;
const LIT = 26;
const CHECK = 27;
const LENGTH = 28;
const DONE = 29;
const BAD1 = 30;
const MEM = 31;
const ENOUGH_LENS = 852;
const ENOUGH_DISTS = 592;
function zswap32(q) {
    return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
}
class InflateState {
    mode = 0;
    last = false;
    wrap = 0;
    havedict = false;
    flags = 0;
    dmax = 0;
    check = 0;
    total = 0;
    head = null;
    wbits = 0;
    wsize = 0;
    whave = 0;
    wnext = 0;
    window = null;
    hold = 0;
    bits = 0;
    length = 0;
    offset = 0;
    extra = 0;
    lencode = null;
    distcode = null;
    lenbits = 0;
    distbits = 0;
    ncode = 0;
    nlen = 0;
    ndist = 0;
    have = 0;
    next = null;
    lens = new Uint16Array(320);
    work = new Uint16Array(288);
    lendyn = null;
    distdyn = null;
    sane = 0;
    back = 0;
    was = 0;
}
function inflateResetKeep(strm) {
    let state;
    if (!strm || !strm.state) return Z_STREAM_ERROR1;
    state = strm.state;
    strm.total_in = strm.total_out = state.total = 0;
    strm.msg = "";
    if (state.wrap) {
        strm.adler = state.wrap & 1;
    }
    state.mode = HEAD;
    state.last = 0;
    state.havedict = 0;
    state.dmax = 32768;
    state.head = null;
    state.hold = 0;
    state.bits = 0;
    state.lencode = state.lendyn = new Uint32Array(ENOUGH_LENS);
    state.distcode = state.distdyn = new Uint32Array(ENOUGH_DISTS);
    state.sane = 1;
    state.back = -1;
    return 0;
}
function inflateReset(strm) {
    let state;
    if (!strm || !strm.state) return Z_STREAM_ERROR1;
    state = strm.state;
    state.wsize = 0;
    state.whave = 0;
    state.wnext = 0;
    return inflateResetKeep(strm);
}
function inflateReset2(strm, windowBits) {
    let wrap;
    let state;
    if (!strm || !strm.state) return Z_STREAM_ERROR1;
    state = strm.state;
    if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
    } else {
        wrap = (windowBits >> 4) + 1;
        if (windowBits < 48) {
            windowBits &= 15;
        }
    }
    if (windowBits && (windowBits < 8 || windowBits > 15)) {
        return Z_STREAM_ERROR1;
    }
    if (state.window !== null && state.wbits !== windowBits) {
        state.window = null;
    }
    state.wrap = wrap;
    state.wbits = windowBits;
    return inflateReset(strm);
}
function inflateInit2(strm, windowBits) {
    let ret;
    let state;
    if (!strm) return Z_STREAM_ERROR1;
    state = new InflateState();
    strm.state = state;
    state.window = null;
    ret = inflateReset2(strm, windowBits);
    if (ret !== 0) {
        strm.state = null;
    }
    return ret;
}
let virgin = true;
let lenfix, distfix;
function fixedtables(state) {
    if (virgin) {
        let sym;
        lenfix = new Uint32Array(512);
        distfix = new Uint32Array(32);
        sym = 0;
        while(sym < 144)state.lens[sym++] = 8;
        while(sym < 256)state.lens[sym++] = 9;
        while(sym < 280)state.lens[sym++] = 7;
        while(sym < 288)state.lens[sym++] = 8;
        inflate_table(1, state.lens, 0, 288, lenfix, 0, state.work, {
            bits: 9
        });
        sym = 0;
        while(sym < 32)state.lens[sym++] = 5;
        inflate_table(2, state.lens, 0, 32, distfix, 0, state.work, {
            bits: 5
        });
        virgin = false;
    }
    state.lencode = lenfix;
    state.lenbits = 9;
    state.distcode = distfix;
    state.distbits = 5;
}
function updatewindow(strm, src, end, copy) {
    let dist;
    let state = strm.state;
    if (state.window === null) {
        state.wsize = 1 << state.wbits;
        state.wnext = 0;
        state.whave = 0;
        state.window = new Uint8Array(state.wsize);
    }
    if (copy >= state.wsize) {
        state.window.set(src.subarray(end - state.wsize, end), 0);
        state.wnext = 0;
        state.whave = state.wsize;
    } else {
        dist = state.wsize - state.wnext;
        if (dist > copy) {
            dist = copy;
        }
        state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
        copy -= dist;
        if (copy) {
            state.window.set(src.subarray(end - copy, end), 0);
            state.wnext = copy;
            state.whave = state.wsize;
        } else {
            state.wnext += dist;
            if (state.wnext === state.wsize) state.wnext = 0;
            if (state.whave < state.wsize) state.whave += dist;
        }
    }
    return 0;
}
function inflate2(strm, flush) {
    let state;
    let input, output;
    let next;
    let put;
    let have, left;
    let hold;
    let bits;
    let _in, _out;
    let copy;
    let from;
    let from_source;
    let here = 0;
    let here_bits, here_op, here_val;
    let last_bits, last_op, last_val;
    let len;
    let ret;
    let hbuf = new Uint8Array(4);
    let opts;
    let n;
    let order = [
        16,
        17,
        18,
        0,
        8,
        7,
        9,
        6,
        10,
        5,
        11,
        4,
        12,
        3,
        13,
        2,
        14,
        1,
        15
    ];
    if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
        return Z_STREAM_ERROR1;
    }
    state = strm.state;
    if (state.mode === 12) state.mode = TYPEDO;
    put = strm.next_out;
    output = strm.output;
    left = strm.avail_out;
    next = strm.next_in;
    input = strm.input;
    have = strm.avail_in;
    hold = state.hold;
    bits = state.bits;
    _in = have;
    _out = left;
    ret = Z_OK;
    inf_leave: for(;;){
        switch(state.mode){
            case 1:
                if (state.wrap === 0) {
                    state.mode = TYPEDO;
                    break;
                }
                while(bits < 16){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                if (state.wrap & 2 && hold === 35615) {
                    state.check = 0;
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32(state.check, hbuf, 2, 0);
                    hold = 0;
                    bits = 0;
                    state.mode = FLAGS;
                    break;
                }
                state.flags = 0;
                if (state.head) {
                    state.head.done = false;
                }
                if (!(state.wrap & 1) || (((hold & 255) << 8) + (hold >> 8)) % 31) {
                    strm.msg = "incorrect header check";
                    state.mode = BAD1;
                    break;
                }
                if ((hold & 15) !== 8) {
                    strm.msg = "unknown compression method";
                    state.mode = BAD1;
                    break;
                }
                hold >>>= 4;
                bits -= 4;
                len = (hold & 15) + 8;
                if (state.wbits === 0) {
                    state.wbits = len;
                } else if (len > state.wbits) {
                    strm.msg = "invalid window size";
                    state.mode = BAD1;
                    break;
                }
                state.dmax = 1 << len;
                strm.adler = state.check = 1;
                state.mode = hold & 512 ? DICTID : TYPE1;
                hold = 0;
                bits = 0;
                break;
            case 2:
                while(bits < 16){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                state.flags = hold;
                if ((state.flags & 255) !== 8) {
                    strm.msg = "unknown compression method";
                    state.mode = BAD1;
                    break;
                }
                if (state.flags & 57344) {
                    strm.msg = "unknown header flags set";
                    state.mode = BAD1;
                    break;
                }
                if (state.head) {
                    state.head.text = hold >> 8 & 1;
                }
                if (state.flags & 512) {
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = TIME;
            case 3:
                while(bits < 32){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                if (state.head) {
                    state.head.time = hold;
                }
                if (state.flags & 512) {
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    hbuf[2] = hold >>> 16 & 255;
                    hbuf[3] = hold >>> 24 & 255;
                    state.check = crc32(state.check, hbuf, 4, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = OS;
            case 4:
                while(bits < 16){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                if (state.head) {
                    state.head.xflags = hold & 255;
                    state.head.os = hold >> 8;
                }
                if (state.flags & 512) {
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = EXLEN;
            case 5:
                if (state.flags & 1024) {
                    while(bits < 16){
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    state.length = hold;
                    if (state.head) {
                        state.head.extra_len = hold;
                    }
                    if (state.flags & 512) {
                        hbuf[0] = hold & 255;
                        hbuf[1] = hold >>> 8 & 255;
                        state.check = crc32(state.check, hbuf, 2, 0);
                    }
                    hold = 0;
                    bits = 0;
                } else if (state.head) {
                    state.head.extra = null;
                }
                state.mode = EXTRA;
            case 6:
                if (state.flags & 1024) {
                    copy = state.length;
                    if (copy > have) copy = have;
                    if (copy) {
                        if (state.head) {
                            len = state.head.extra_len - state.length;
                            if (!state.head.extra) {
                                state.head.extra = new Array(state.head.extra_len);
                            }
                            state.head.extra.set(input.subarray(next, next + copy), len);
                        }
                        if (state.flags & 512) {
                            state.check = crc32(state.check, input, copy, next);
                        }
                        have -= copy;
                        next += copy;
                        state.length -= copy;
                    }
                    if (state.length) break inf_leave;
                }
                state.length = 0;
                state.mode = NAME;
            case 7:
                if (state.flags & 2048) {
                    if (have === 0) break inf_leave;
                    copy = 0;
                    do {
                        len = input[next + copy++];
                        if (state.head && len && state.length < 65536) {
                            state.head.name += String.fromCharCode(len);
                        }
                    }while (len && copy < have)
                    if (state.flags & 512) {
                        state.check = crc32(state.check, input, copy, next);
                    }
                    have -= copy;
                    next += copy;
                    if (len) break inf_leave;
                } else if (state.head) {
                    state.head.name = null;
                }
                state.length = 0;
                state.mode = COMMENT;
            case 8:
                if (state.flags & 4096) {
                    if (have === 0) break inf_leave;
                    copy = 0;
                    do {
                        len = input[next + copy++];
                        if (state.head && len && state.length < 65536) {
                            state.head.comment += String.fromCharCode(len);
                        }
                    }while (len && copy < have)
                    if (state.flags & 512) {
                        state.check = crc32(state.check, input, copy, next);
                    }
                    have -= copy;
                    next += copy;
                    if (len) break inf_leave;
                } else if (state.head) {
                    state.head.comment = null;
                }
                state.mode = HCRC;
            case 9:
                if (state.flags & 512) {
                    while(bits < 16){
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    if (hold !== (state.check & 65535)) {
                        strm.msg = "header crc mismatch";
                        state.mode = BAD1;
                        break;
                    }
                    hold = 0;
                    bits = 0;
                }
                if (state.head) {
                    state.head.hcrc = state.flags >> 9 & 1;
                    state.head.done = true;
                }
                strm.adler = state.check = 0;
                state.mode = TYPE1;
                break;
            case 10:
                while(bits < 32){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                strm.adler = state.check = zswap32(hold);
                hold = 0;
                bits = 0;
                state.mode = DICT;
            case 11:
                if (state.havedict === 0) {
                    strm.next_out = put;
                    strm.avail_out = left;
                    strm.next_in = next;
                    strm.avail_in = have;
                    state.hold = hold;
                    state.bits = bits;
                    return 2;
                }
                strm.adler = state.check = 1;
                state.mode = TYPE1;
            case 12:
                if (flush === 5 || flush === 6) break inf_leave;
            case 13:
                if (state.last) {
                    hold >>>= bits & 7;
                    bits -= bits & 7;
                    state.mode = CHECK;
                    break;
                }
                while(bits < 3){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                state.last = hold & 1;
                hold >>>= 1;
                bits -= 1;
                switch(hold & 3){
                    case 0:
                        state.mode = STORED;
                        break;
                    case 1:
                        fixedtables(state);
                        state.mode = LEN_;
                        if (flush === 6) {
                            hold >>>= 2;
                            bits -= 2;
                            break inf_leave;
                        }
                        break;
                    case 2:
                        state.mode = TABLE;
                        break;
                    case 3:
                        strm.msg = "invalid block type";
                        state.mode = BAD1;
                }
                hold >>>= 2;
                bits -= 2;
                break;
            case 14:
                hold >>>= bits & 7;
                bits -= bits & 7;
                while(bits < 32){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                    strm.msg = "invalid stored block lengths";
                    state.mode = BAD1;
                    break;
                }
                state.length = hold & 65535;
                hold = 0;
                bits = 0;
                state.mode = COPY_;
                if (flush === 6) break inf_leave;
            case 15:
                state.mode = COPY;
            case 16:
                copy = state.length;
                if (copy) {
                    if (copy > have) copy = have;
                    if (copy > left) copy = left;
                    if (copy === 0) break inf_leave;
                    output.set(input.subarray(next, next + copy), put);
                    have -= copy;
                    next += copy;
                    left -= copy;
                    put += copy;
                    state.length -= copy;
                    break;
                }
                state.mode = TYPE1;
                break;
            case 17:
                while(bits < 14){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                state.nlen = (hold & 31) + 257;
                hold >>>= 5;
                bits -= 5;
                state.ndist = (hold & 31) + 1;
                hold >>>= 5;
                bits -= 5;
                state.ncode = (hold & 15) + 4;
                hold >>>= 4;
                bits -= 4;
                if (state.nlen > 286 || state.ndist > 30) {
                    strm.msg = "too many length or distance symbols";
                    state.mode = BAD1;
                    break;
                }
                state.have = 0;
                state.mode = LENLENS;
            case 18:
                while(state.have < state.ncode){
                    while(bits < 3){
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    state.lens[order[state.have++]] = hold & 7;
                    hold >>>= 3;
                    bits -= 3;
                }
                while(state.have < 19){
                    state.lens[order[state.have++]] = 0;
                }
                state.lencode = state.lendyn;
                state.lenbits = 7;
                opts = {
                    bits: state.lenbits
                };
                ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
                state.lenbits = opts.bits;
                if (ret) {
                    strm.msg = "invalid code lengths set";
                    state.mode = BAD1;
                    break;
                }
                state.have = 0;
                state.mode = CODELENS;
            case 19:
                while(state.have < state.nlen + state.ndist){
                    for(;;){
                        here = state.lencode[hold & (1 << state.lenbits) - 1];
                        here_bits = here >>> 24;
                        here_op = here >>> 16 & 255;
                        here_val = here & 65535;
                        if (here_bits <= bits) break;
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    if (here_val < 16) {
                        hold >>>= here_bits;
                        bits -= here_bits;
                        state.lens[state.have++] = here_val;
                    } else {
                        if (here_val === 16) {
                            n = here_bits + 2;
                            while(bits < n){
                                if (have === 0) break inf_leave;
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            hold >>>= here_bits;
                            bits -= here_bits;
                            if (state.have === 0) {
                                strm.msg = "invalid bit length repeat";
                                state.mode = BAD1;
                                break;
                            }
                            len = state.lens[state.have - 1];
                            copy = 3 + (hold & 3);
                            hold >>>= 2;
                            bits -= 2;
                        } else if (here_val === 17) {
                            n = here_bits + 3;
                            while(bits < n){
                                if (have === 0) break inf_leave;
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            hold >>>= here_bits;
                            bits -= here_bits;
                            len = 0;
                            copy = 3 + (hold & 7);
                            hold >>>= 3;
                            bits -= 3;
                        } else {
                            n = here_bits + 7;
                            while(bits < n){
                                if (have === 0) break inf_leave;
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            hold >>>= here_bits;
                            bits -= here_bits;
                            len = 0;
                            copy = 11 + (hold & 127);
                            hold >>>= 7;
                            bits -= 7;
                        }
                        if (state.have + copy > state.nlen + state.ndist) {
                            strm.msg = "invalid bit length repeat";
                            state.mode = BAD1;
                            break;
                        }
                        while(copy--){
                            state.lens[state.have++] = len;
                        }
                    }
                }
                if (state.mode === 30) break;
                if (state.lens[256] === 0) {
                    strm.msg = "invalid code -- missing end-of-block";
                    state.mode = BAD1;
                    break;
                }
                state.lenbits = 9;
                opts = {
                    bits: state.lenbits
                };
                ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
                state.lenbits = opts.bits;
                if (ret) {
                    strm.msg = "invalid literal/lengths set";
                    state.mode = BAD1;
                    break;
                }
                state.distbits = 6;
                state.distcode = state.distdyn;
                opts = {
                    bits: state.distbits
                };
                ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
                state.distbits = opts.bits;
                if (ret) {
                    strm.msg = "invalid distances set";
                    state.mode = BAD1;
                    break;
                }
                state.mode = LEN_;
                if (flush === 6) break inf_leave;
            case 20:
                state.mode = LEN;
            case 21:
                if (have >= 6 && left >= 258) {
                    strm.next_out = put;
                    strm.avail_out = left;
                    strm.next_in = next;
                    strm.avail_in = have;
                    state.hold = hold;
                    state.bits = bits;
                    inflate_fast(strm, _out);
                    put = strm.next_out;
                    output = strm.output;
                    left = strm.avail_out;
                    next = strm.next_in;
                    input = strm.input;
                    have = strm.avail_in;
                    hold = state.hold;
                    bits = state.bits;
                    if (state.mode === 12) {
                        state.back = -1;
                    }
                    break;
                }
                state.back = 0;
                for(;;){
                    here = state.lencode[hold & (1 << state.lenbits) - 1];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (here_bits <= bits) break;
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                if (here_op && (here_op & 240) === 0) {
                    last_bits = here_bits;
                    last_op = here_op;
                    last_val = here_val;
                    for(;;){
                        here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                        here_bits = here >>> 24;
                        here_op = here >>> 16 & 255;
                        here_val = here & 65535;
                        if (last_bits + here_bits <= bits) break;
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    hold >>>= last_bits;
                    bits -= last_bits;
                    state.back += last_bits;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                state.back += here_bits;
                state.length = here_val;
                if (here_op === 0) {
                    state.mode = LIT;
                    break;
                }
                if (here_op & 32) {
                    state.back = -1;
                    state.mode = TYPE1;
                    break;
                }
                if (here_op & 64) {
                    strm.msg = "invalid literal/length code";
                    state.mode = BAD1;
                    break;
                }
                state.extra = here_op & 15;
                state.mode = LENEXT;
            case 22:
                if (state.extra) {
                    n = state.extra;
                    while(bits < n){
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    state.length += hold & (1 << state.extra) - 1;
                    hold >>>= state.extra;
                    bits -= state.extra;
                    state.back += state.extra;
                }
                state.was = state.length;
                state.mode = DIST;
            case 23:
                for(;;){
                    here = state.distcode[hold & (1 << state.distbits) - 1];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (here_bits <= bits) break;
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                if ((here_op & 240) === 0) {
                    last_bits = here_bits;
                    last_op = here_op;
                    last_val = here_val;
                    for(;;){
                        here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                        here_bits = here >>> 24;
                        here_op = here >>> 16 & 255;
                        here_val = here & 65535;
                        if (last_bits + here_bits <= bits) break;
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    hold >>>= last_bits;
                    bits -= last_bits;
                    state.back += last_bits;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                state.back += here_bits;
                if (here_op & 64) {
                    strm.msg = "invalid distance code";
                    state.mode = BAD1;
                    break;
                }
                state.offset = here_val;
                state.extra = here_op & 15;
                state.mode = DISTEXT;
            case 24:
                if (state.extra) {
                    n = state.extra;
                    while(bits < n){
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    state.offset += hold & (1 << state.extra) - 1;
                    hold >>>= state.extra;
                    bits -= state.extra;
                    state.back += state.extra;
                }
                if (state.offset > state.dmax) {
                    strm.msg = "invalid distance too far back";
                    state.mode = BAD1;
                    break;
                }
                state.mode = MATCH;
            case 25:
                if (left === 0) break inf_leave;
                copy = _out - left;
                if (state.offset > copy) {
                    copy = state.offset - copy;
                    if (copy > state.whave) {
                        if (state.sane) {
                            strm.msg = "invalid distance too far back";
                            state.mode = BAD1;
                            break;
                        }
                    }
                    if (copy > state.wnext) {
                        copy -= state.wnext;
                        from = state.wsize - copy;
                    } else {
                        from = state.wnext - copy;
                    }
                    if (copy > state.length) copy = state.length;
                    from_source = state.window;
                } else {
                    from_source = output;
                    from = put - state.offset;
                    copy = state.length;
                }
                if (copy > left) copy = left;
                left -= copy;
                state.length -= copy;
                do {
                    output[put++] = from_source[from++];
                }while (--copy)
                if (state.length === 0) state.mode = LEN;
                break;
            case 26:
                if (left === 0) break inf_leave;
                output[put++] = state.length;
                left--;
                state.mode = LEN;
                break;
            case 27:
                if (state.wrap) {
                    while(bits < 32){
                        if (have === 0) break inf_leave;
                        have--;
                        hold |= input[next++] << bits;
                        bits += 8;
                    }
                    _out -= left;
                    strm.total_out += _out;
                    state.total += _out;
                    if (_out) {
                        strm.adler = state.check = state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
                    }
                    _out = left;
                    if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                        strm.msg = "incorrect data check";
                        state.mode = BAD1;
                        break;
                    }
                    hold = 0;
                    bits = 0;
                }
                state.mode = LENGTH;
            case 28:
                if (state.wrap && state.flags) {
                    while(bits < 32){
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    if (hold !== (state.total & 4294967295)) {
                        strm.msg = "incorrect length check";
                        state.mode = BAD1;
                        break;
                    }
                    hold = 0;
                    bits = 0;
                }
                state.mode = DONE;
            case 29:
                ret = Z_STREAM_END;
                break inf_leave;
            case 30:
                ret = Z_DATA_ERROR;
                break inf_leave;
            case 31:
                return Z_MEM_ERROR;
            case 32:
            default:
                return Z_STREAM_ERROR1;
        }
    }
    strm.next_out = put;
    strm.avail_out = left;
    strm.next_in = next;
    strm.avail_in = have;
    state.hold = hold;
    state.bits = bits;
    if (state.wsize || _out !== strm.avail_out && state.mode < 30 && (state.mode < 27 || flush !== 4)) {
        if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
            state.mode = MEM;
            return Z_MEM_ERROR;
        }
    }
    _in -= strm.avail_in;
    _out -= strm.avail_out;
    strm.total_in += _in;
    strm.total_out += _out;
    state.total += _out;
    if (state.wrap && _out) {
        strm.adler = state.check = state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
    }
    strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE1 ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
    if ((_in === 0 && _out === 0 || flush === 4) && ret === 0) {
        ret = Z_BUF_ERROR;
    }
    return ret;
}
function inflateEnd(strm) {
    if (!strm || !strm.state) {
        return Z_STREAM_ERROR1;
    }
    let state = strm.state;
    if (state.window) {
        state.window = null;
    }
    strm.state = null;
    return 0;
}
function inflateGetHeader(strm, head) {
    let state;
    if (!strm || !strm.state) return Z_STREAM_ERROR1;
    state = strm.state;
    if ((state.wrap & 2) === 0) return Z_STREAM_ERROR1;
    state.head = head;
    head.done = false;
    return 0;
}
function inflateSetDictionary(strm, dictionary) {
    let dictLength = dictionary.length;
    let state;
    let dictid;
    let ret;
    if (!strm || !strm.state) {
        return Z_STREAM_ERROR1;
    }
    state = strm.state;
    if (state.wrap !== 0 && state.mode !== 11) {
        return Z_STREAM_ERROR1;
    }
    if (state.mode === 11) {
        dictid = 1;
        dictid = adler32(dictid, dictionary, dictLength, 0);
        if (dictid !== state.check) {
            return Z_DATA_ERROR;
        }
    }
    ret = updatewindow(strm, dictionary, dictLength, dictLength);
    if (ret) {
        state.mode = MEM;
        return Z_MEM_ERROR;
    }
    state.havedict = 1;
    return 0;
}
class GZheader {
    text = 0;
    time = 0;
    xflags = 0;
    os = 0;
    extra = null;
    extra_len = 0;
    name = "";
    comment = "";
    hcrc = 0;
    done = false;
}
class Inflate {
    err = 0;
    msg = "";
    ended = false;
    strm;
    options;
    header;
    constructor(options2){
        this.options = {
            chunkSize: 16384,
            windowBits: 0,
            to: "",
            ...options2
        };
        const opt1 = this.options;
        if (opt1.raw && opt1.windowBits >= 0 && opt1.windowBits < 16) {
            opt1.windowBits = -opt1.windowBits;
            if (opt1.windowBits === 0) opt1.windowBits = -15;
        }
        if (opt1.windowBits >= 0 && opt1.windowBits < 16 && !(options2 && options2.windowBits)) {
            opt1.windowBits += 32;
        }
        if (opt1.windowBits > 15 && opt1.windowBits < 48) {
            if ((opt1.windowBits & 15) === 0) {
                opt1.windowBits |= 15;
            }
        }
        this.strm = new ZStream();
        this.strm.avail_out = 0;
        var status2 = inflateInit2(this.strm, opt1.windowBits);
        if (status2 !== STATUS.Z_OK) {
            throw new Error(message2[status2]);
        }
        this.header = new GZheader();
        inflateGetHeader(this.strm, this.header);
        if (opt1.dictionary) {
            if (opt1.raw) {
                status2 = inflateSetDictionary(this.strm, opt1.dictionary);
                if (status2 !== STATUS.Z_OK) {
                    throw new Error(message2[status2]);
                }
            }
        }
    }
    push(data, mode) {
        const strm = this.strm;
        const chunkSize = this.options.chunkSize;
        const dictionary = this.options.dictionary;
        const chunks = [];
        let status;
        var allowBufError = false;
        if (this.ended) {
            throw new Error("can not call after ended");
        }
        let _mode = mode === ~~mode ? mode : mode === true ? STATUS.Z_FINISH : STATUS.Z_NO_FLUSH;
        strm.input = data;
        strm.next_in = 0;
        strm.avail_in = strm.input.length;
        do {
            if (strm.avail_out === 0) {
                strm.output = new Uint8Array(chunkSize);
                strm.next_out = 0;
                strm.avail_out = chunkSize;
            }
            status = inflate2(strm, STATUS.Z_NO_FLUSH);
            if (status === STATUS.Z_NEED_DICT && dictionary) {
                status = inflateSetDictionary(this.strm, dictionary);
            }
            if (status === STATUS.Z_BUF_ERROR && allowBufError === true) {
                status = STATUS.Z_OK;
                allowBufError = false;
            }
            if (status !== STATUS.Z_STREAM_END && status !== STATUS.Z_OK) {
                this.ended = true;
                throw new Error(this.strm.msg);
            }
            if (strm.next_out) {
                if (strm.avail_out === 0 || status === STATUS.Z_STREAM_END || strm.avail_in === 0 && (_mode === STATUS.Z_FINISH || _mode === STATUS.Z_SYNC_FLUSH)) {
                    chunks.push(strm.output.subarray(0, strm.next_out));
                }
            }
            if (strm.avail_in === 0 && strm.avail_out === 0) {
                allowBufError = true;
            }
        }while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== STATUS.Z_STREAM_END)
        if (status === STATUS.Z_STREAM_END) {
            _mode = STATUS.Z_FINISH;
        }
        if (_mode === STATUS.Z_FINISH) {
            status = inflateEnd(this.strm);
            this.ended = true;
            if (status !== STATUS.Z_OK) throw new Error(this.strm.msg);
        }
        if (_mode === STATUS.Z_SYNC_FLUSH) {
            strm.avail_out = 0;
        }
        return concatUint8Array(chunks);
    }
}
function inflate1(input, options = {
}) {
    const inflator = new Inflate(options);
    const result = inflator.push(input, true);
    if (inflator.err) throw inflator.msg || message2[inflator.err];
    return result;
}
const gunzip = inflate1;
function deCompress(rawData) {
    return gunzip(rawData);
}
const REGISTERS = [
    "ip",
    "acc",
    "r1",
    "r2",
    "r3",
    "r4",
    "r5",
    "r6",
    "r7",
    "r8",
    "r9",
    "R",
    "G",
    "B",
    "COL",
    "x",
    "y",
    "li",
    "sp",
    "fp",
    "mb",
    "im", 
];
var RegisterIndexOf;
(function(RegisterIndexOf) {
    RegisterIndexOf[RegisterIndexOf["ip"] = 0] = "ip";
    RegisterIndexOf[RegisterIndexOf["acc"] = 1] = "acc";
    RegisterIndexOf[RegisterIndexOf["r1"] = 2] = "r1";
    RegisterIndexOf[RegisterIndexOf["r2"] = 3] = "r2";
    RegisterIndexOf[RegisterIndexOf["r3"] = 4] = "r3";
    RegisterIndexOf[RegisterIndexOf["r4"] = 5] = "r4";
    RegisterIndexOf[RegisterIndexOf["r5"] = 6] = "r5";
    RegisterIndexOf[RegisterIndexOf["r6"] = 7] = "r6";
    RegisterIndexOf[RegisterIndexOf["r7"] = 8] = "r7";
    RegisterIndexOf[RegisterIndexOf["r8"] = 9] = "r8";
    RegisterIndexOf[RegisterIndexOf["r9"] = 10] = "r9";
    RegisterIndexOf[RegisterIndexOf["R"] = 11] = "R";
    RegisterIndexOf[RegisterIndexOf["G"] = 12] = "G";
    RegisterIndexOf[RegisterIndexOf["B"] = 13] = "B";
    RegisterIndexOf[RegisterIndexOf["COL"] = 14] = "COL";
    RegisterIndexOf[RegisterIndexOf["x"] = 15] = "x";
    RegisterIndexOf[RegisterIndexOf["y"] = 16] = "y";
    RegisterIndexOf[RegisterIndexOf["li"] = 17] = "li";
    RegisterIndexOf[RegisterIndexOf["sp"] = 18] = "sp";
    RegisterIndexOf[RegisterIndexOf["fp"] = 19] = "fp";
    RegisterIndexOf[RegisterIndexOf["mb"] = 20] = "mb";
    RegisterIndexOf[RegisterIndexOf["im"] = 21] = "im";
})(RegisterIndexOf || (RegisterIndexOf = {
}));
const PUSHABLE_STATE = REGISTERS.slice(0, RegisterIndexOf.y + 1);
var Instructions;
(function(Instructions) {
    Instructions[Instructions["MOVE"] = 1] = "MOVE";
    Instructions[Instructions["MOVE_S"] = 2] = "MOVE_S";
    Instructions[Instructions["ADD"] = 3] = "ADD";
    Instructions[Instructions["SUBTRACT"] = 4] = "SUBTRACT";
    Instructions[Instructions["INC_REG"] = 5] = "INC_REG";
    Instructions[Instructions["DEC_REG"] = 6] = "DEC_REG";
    Instructions[Instructions["MULTIPLY"] = 7] = "MULTIPLY";
    Instructions[Instructions["BITWISE_SHIFT"] = 8] = "BITWISE_SHIFT";
    Instructions[Instructions["BITWISE_AND"] = 9] = "BITWISE_AND";
    Instructions[Instructions["BITWISE_OR"] = 10] = "BITWISE_OR";
    Instructions[Instructions["NOT"] = 11] = "NOT";
    Instructions[Instructions["JMP_ACC"] = 12] = "JMP_ACC";
    Instructions[Instructions["GOTO"] = 13] = "GOTO";
    Instructions[Instructions["PSH_LIT"] = 14] = "PSH_LIT";
    Instructions[Instructions["PSH_REG"] = 15] = "PSH_REG";
    Instructions[Instructions["PSH_STATE"] = 16] = "PSH_STATE";
    Instructions[Instructions["POP"] = 17] = "POP";
    Instructions[Instructions["CALL"] = 18] = "CALL";
    Instructions[Instructions["RET"] = 19] = "RET";
    Instructions[Instructions["RET_TO_NEXT"] = 20] = "RET_TO_NEXT";
    Instructions[Instructions["HLT"] = 21] = "HLT";
    Instructions[Instructions["RET_INT"] = 22] = "RET_INT";
    Instructions[Instructions["INT"] = 23] = "INT";
    Instructions[Instructions["PSH_IP"] = 24] = "PSH_IP";
    Instructions[Instructions["PSH_IP_OFFSETTED"] = 25] = "PSH_IP_OFFSETTED";
    Instructions[Instructions["RAND"] = 26] = "RAND";
    Instructions[Instructions["SKIP"] = 27] = "SKIP";
    Instructions[Instructions["INTERVAL"] = 28] = "INTERVAL";
    Instructions[Instructions["MODIFY_PIXEL_REG"] = 29] = "MODIFY_PIXEL_REG";
    Instructions[Instructions["MODIFY_PIXEL"] = 30] = "MODIFY_PIXEL";
    Instructions[Instructions["RENDER"] = 31] = "RENDER";
    Instructions[Instructions["SLEEP"] = 32] = "SLEEP";
    Instructions[Instructions["FETCH_IMAGE_INFO"] = 33] = "FETCH_IMAGE_INFO";
    Instructions[Instructions["FETCH_PIXEL_NEIGHBOR"] = 34] = "FETCH_PIXEL_NEIGHBOR";
    Instructions[Instructions["FETCH_PIXEL_COLOR_BY_INDEX"] = 35] = "FETCH_PIXEL_COLOR_BY_INDEX";
    Instructions[Instructions["FETCH_PIXEL_INDEX_BY_REG_COORDINATES"] = 36] = "FETCH_PIXEL_INDEX_BY_REG_COORDINATES";
    Instructions[Instructions["FETCH_PIXEL_INDEX"] = 37] = "FETCH_PIXEL_INDEX";
    Instructions[Instructions["RGB_FROMREG_TO_COLOR"] = 38] = "RGB_FROMREG_TO_COLOR";
    Instructions[Instructions["RGB_TO_COLOR"] = 39] = "RGB_TO_COLOR";
    Instructions[Instructions["COLOR_FROMREG_TO_RGB"] = 40] = "COLOR_FROMREG_TO_RGB";
    Instructions[Instructions["DRAW_BOX"] = 41] = "DRAW_BOX";
    Instructions[Instructions["DRAW_BOX_MANUAL"] = 42] = "DRAW_BOX_MANUAL";
    Instructions[Instructions["DRAW_CIRCLE"] = 43] = "DRAW_CIRCLE";
    Instructions[Instructions["DRAW_LINE_POINTS"] = 44] = "DRAW_LINE_POINTS";
    Instructions[Instructions["MODIFY_LUMINOSITY"] = 45] = "MODIFY_LUMINOSITY";
    Instructions[Instructions["LANGTONS_ANT"] = 46] = "LANGTONS_ANT";
    Instructions[Instructions["SEEDS"] = 47] = "SEEDS";
    Instructions[Instructions["DEBUG"] = 48] = "DEBUG";
})(Instructions || (Instructions = {
}));
var ParameterFetchType;
(function(ParameterFetchType) {
    ParameterFetchType[ParameterFetchType["unsignedINT8"] = 0] = "unsignedINT8";
    ParameterFetchType[ParameterFetchType["signedINT8"] = 1] = "signedINT8";
    ParameterFetchType[ParameterFetchType["unsignedINT16"] = 2] = "unsignedINT16";
    ParameterFetchType[ParameterFetchType["signedINT16"] = 3] = "signedINT16";
    ParameterFetchType[ParameterFetchType["unsignedINT32"] = 4] = "unsignedINT32";
    ParameterFetchType[ParameterFetchType["signedINT32"] = 5] = "signedINT32";
    ParameterFetchType[ParameterFetchType["registerIndex"] = 6] = "registerIndex";
})(ParameterFetchType || (ParameterFetchType = {
}));
const InstructionParams = [
    [],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.signedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.signedINT32
    ],
    [
        ParameterFetchType.signedINT32
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT32
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT32
    ],
    [
        ParameterFetchType.unsignedINT32
    ],
    [
        ParameterFetchType.unsignedINT32
    ],
    [],
    [
        ParameterFetchType.unsignedINT32
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32, 
    ],
    [],
    [],
    [],
    [],
    [
        ParameterFetchType.unsignedINT32
    ],
    [],
    [
        ParameterFetchType.unsignedINT32
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT32
    ],
    [
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [],
    [
        ParameterFetchType.unsignedINT32
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT16,
        ParameterFetchType.unsignedINT16, 
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT16,
        ParameterFetchType.unsignedINT16,
        ParameterFetchType.unsignedINT16,
        ParameterFetchType.unsignedINT16,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT16, 
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.unsignedINT16,
        ParameterFetchType.unsignedINT16,
        ParameterFetchType.unsignedINT16,
        ParameterFetchType.unsignedINT16, 
    ],
    [
        ParameterFetchType.unsignedINT8,
        ParameterFetchType.signedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT32,
        ParameterFetchType.unsignedINT32, 
    ],
    [
        ParameterFetchType.unsignedINT8
    ]
];
const createMemory = (sizeInBytes)=>{
    const ab = new ArrayBuffer(sizeInBytes);
    const dv = new DataView(ab);
    return dv;
};
const INSTRUCTION_LENGTH_IN_BYTES = 4;
class MemoryMapper {
    regions;
    constructor(){
        this.regions = [];
    }
    map(device, start, end, remap = true) {
        const region = {
            device,
            start,
            end,
            remap
        };
        this.regions.unshift(region);
        return ()=>{
            this.regions = this.regions.filter((x)=>x !== region
            );
        };
    }
    findRegion(address) {
        const region = this.regions.find((r)=>address >= r.start && address <= r.end
        );
        if (!region) {
            throw new Error(`No memory region found for address ${address}`);
        }
        return region;
    }
    getUint16(address) {
        const region = this.findRegion(address);
        const finalAddress = region.remap ? address - region.start : address;
        return region.device.getUint16(finalAddress);
    }
    getInt16(address) {
        const region = this.findRegion(address);
        const finalAddress = region.remap ? address - region.start : address;
        return region.device.getInt16(finalAddress);
    }
    getUint8(address) {
        const region = this.findRegion(address);
        const finalAddress = region.remap ? address - region.start : address;
        return region.device.getUint8(finalAddress);
    }
    getInt8(address) {
        const region = this.findRegion(address);
        const finalAddress = region.remap ? address - region.start : address;
        return region.device.getInt8(finalAddress);
    }
    getUint32(address) {
        const region = this.findRegion(address);
        const finalAddress = region.remap ? address - region.start : address;
        return region.device.getUint32(finalAddress);
    }
    getInt32(address) {
        const region = this.findRegion(address);
        const finalAddress = region.remap ? address - region.start : address;
        return region.device.getInt32(finalAddress);
    }
    setUint32(address, value) {
        const region = this.findRegion(address);
        const finalAddress = region.remap ? address - region.start : address;
        return region.device.setUint32(finalAddress, value);
    }
    setInt32(address, value) {
        const region = this.findRegion(address);
        const finalAddress = region.remap ? address - region.start : address;
        return region.device.setInt32(finalAddress, value);
    }
    getDataView(ofAddress) {
        return this.findRegion(ofAddress).device;
    }
    setUint16(address, value) {
        const region = this.findRegion(address);
        const finalAddress = region.remap ? address - region.start : address;
        return region.device.setUint16(finalAddress, value);
    }
    setUint8(address, value) {
        const region = this.findRegion(address);
        const finalAddress = region.remap ? address - region.start : address;
        return region.device.setUint8(finalAddress, value);
    }
    load(startAddress, data) {
        data.forEach((__byte, offset)=>this.setUint8(startAddress + offset, __byte)
        );
    }
}
class InstructionParser {
    registers;
    memory;
    registerMap;
    interruptVectorAddress;
    isInInterruptHandler;
    stackFrameSize;
    allocatedAmount;
    halt = false;
    emptyInstructionAtStep = 0;
    constructor(memory1, loadedFile, interruptVectorAddress1 = 150000){
        this.memory = memory1;
        this.allocatedAmount = loadedFile.memoryRequest;
        this.registers = createMemory(REGISTERS.length * INSTRUCTION_LENGTH_IN_BYTES);
        this.registerMap = REGISTERS.reduce((map, name, i)=>{
            map[name] = i * INSTRUCTION_LENGTH_IN_BYTES;
            return map;
        }, {
        });
        this.interruptVectorAddress = interruptVectorAddress1;
        this.isInInterruptHandler = false;
        this.setRegister("im", this.allocatedAmount);
        this.setRegister("sp", this.allocatedAmount - loadedFile.stackSizeRequirement);
        this.setRegister("fp", this.allocatedAmount - loadedFile.stackSizeRequirement);
        this.stackFrameSize = 0;
    }
    fetchRegisterIndex() {
        return this.fetchCurrentInstruction32();
    }
    getRegister(name) {
        if (!(name in this.registerMap)) {
            throw new Error(`getRegister: No such register '${name}'`);
        }
        return this.registers.getUint32(this.registerMap[name]);
    }
    getSignedRegister(name) {
        if (!(name in this.registerMap)) {
            throw new Error(`getRegister: No such register '${name}'`);
        }
        return this.registers.getInt32(this.registerMap[name]);
    }
    getRegisterAt(offset) {
        return this.registers.getUint32(offset);
    }
    getSignedRegisterAt(offset) {
        return this.registers.getInt32(offset);
    }
    setRegister(name, value) {
        if (!(name in this.registerMap)) {
            throw new Error(`setRegister: No such register '${name}'`);
        }
        return this.registers.setUint32(this.registerMap[name], value);
    }
    setSignedRegister(name, value) {
        if (!(name in this.registerMap)) {
            throw new Error(`setRegister: No such register '${name}'`);
        }
        return this.registers.setInt32(this.registerMap[name], value);
    }
    setRegisterAt(offset, value) {
        this.registers.setUint32(offset, value);
    }
    setSignedRegisterAt(offset, value) {
        this.registers.setInt32(offset, value);
    }
    setMemoryAt(offset, value) {
        this.memory.setUint32(offset, value);
    }
    setSignedMemoryAt(offset, value) {
        this.memory.setInt32(offset, value);
    }
    getMemoryAt(offset) {
        return this.memory.getUint32(offset);
    }
    getSignedMemoryAt(offset) {
        return this.memory.getInt32(offset);
    }
    push(value) {
        const spAddress = this.getRegister("sp");
        this.memory.setUint32(spAddress, value);
        this.setRegister("sp", spAddress - 4);
        this.stackFrameSize += INSTRUCTION_LENGTH_IN_BYTES;
    }
    pop() {
        const nextSpAddress = this.getRegister("sp") + 4;
        this.setRegister("sp", nextSpAddress);
        this.stackFrameSize -= INSTRUCTION_LENGTH_IN_BYTES;
        return this.memory.getUint32(nextSpAddress);
    }
    pushState() {
        PUSHABLE_STATE.forEach((r)=>{
            this.push(this.getRegister(r));
        });
        this.push(this.stackFrameSize + 4);
        this.setRegister("fp", this.getRegister("sp"));
        this.stackFrameSize = 0;
    }
    popState() {
        const framePointerAddress = this.getRegister("fp");
        this.setRegister("sp", framePointerAddress);
        this.stackFrameSize = this.pop();
        const stackFrameSize = this.stackFrameSize;
        [
            ...PUSHABLE_STATE
        ].reverse().forEach((x)=>this.setRegister(x, this.pop())
        );
        const nArgs = this.pop();
        for(let i = 0; i < nArgs; i++){
            this.pop();
        }
        this.setRegister("fp", framePointerAddress + stackFrameSize);
    }
    fetchCurrentInstruction8() {
        const nextInstructionAddress = this.getRegister("ip");
        if (nextInstructionAddress + 1 > this.allocatedAmount) {
            this.emptyInstructionAtStep = 9999;
            return -1;
        }
        const instruction = this.memory.getUint8(nextInstructionAddress);
        this.setRegister("ip", nextInstructionAddress + 1);
        return instruction;
    }
    fetchCurrentSignedInstruction8() {
        const nextInstructionAddress = this.getRegister("ip");
        if (nextInstructionAddress + 1 > this.allocatedAmount) {
            this.emptyInstructionAtStep = 9999;
            return -1;
        }
        const instruction = this.memory.getInt8(nextInstructionAddress);
        this.setRegister("ip", nextInstructionAddress + 1);
        return instruction;
    }
    fetchCurrentInstruction16() {
        const nextInstructionAddress = this.getRegister("ip");
        if (nextInstructionAddress + 2 > this.allocatedAmount) {
            this.emptyInstructionAtStep = 9999;
            return -1;
        }
        const instruction = this.memory.getUint16(nextInstructionAddress);
        this.setRegister("ip", nextInstructionAddress + 2);
        return instruction;
    }
    fetchCurrentSignedInstruction16() {
        const nextInstructionAddress = this.getRegister("ip");
        if (nextInstructionAddress + 2 > this.allocatedAmount) {
            this.emptyInstructionAtStep = 9999;
            return -1;
        }
        const instruction = this.memory.getInt16(nextInstructionAddress);
        this.setRegister("ip", nextInstructionAddress + 2);
        return instruction;
    }
    fetchCurrentInstruction32() {
        const nextInstructionAddress = this.getRegister("ip");
        if (nextInstructionAddress + 4 > this.allocatedAmount) {
            this.emptyInstructionAtStep = 9999;
            return -1;
        }
        const instruction = this.memory.getUint32(nextInstructionAddress);
        this.setRegister("ip", nextInstructionAddress + 4);
        return instruction;
    }
    fetchCurrentSignedInstruction32() {
        const nextInstructionAddress = this.getRegister("ip");
        if (nextInstructionAddress + 4 > this.allocatedAmount) {
            this.emptyInstructionAtStep = 9999;
            return -1;
        }
        const instruction = this.memory.getInt32(nextInstructionAddress);
        this.setRegister("ip", nextInstructionAddress + 4);
        return instruction;
    }
    fetchParameter(t) {
        return [
            ()=>this.fetchCurrentInstruction8()
            ,
            ()=>this.fetchCurrentSignedInstruction8()
            ,
            ()=>this.fetchCurrentInstruction16()
            ,
            ()=>this.fetchCurrentSignedInstruction16()
            ,
            ()=>this.fetchCurrentInstruction32()
            ,
            ()=>this.fetchCurrentSignedInstruction32()
            ,
            ()=>this.fetchRegisterIndex()
            , 
        ][t]();
    }
    *fetch() {
        while(true){
            const instruction = this.fetchCurrentInstruction8();
            if (instruction <= 0) break;
            const params = InstructionParams[instruction];
            const arr = new Array(params.length + 1);
            arr[0] = instruction;
            for(let i = 0; i < params.length; i++){
                arr[i + 1] = this.fetchParameter(params[i]);
            }
            yield arr;
        }
    }
}
var arithmetic;
(function(arithmetic) {
    arithmetic[arithmetic["ADDITION"] = 0] = "ADDITION";
    arithmetic[arithmetic["SUBTRACTION"] = 1] = "SUBTRACTION";
    arithmetic[arithmetic["DIVISION"] = 2] = "DIVISION";
    arithmetic[arithmetic["MULTIPLICATION"] = 3] = "MULTIPLICATION";
    arithmetic[arithmetic["BITSHIFT_LEFT"] = 4] = "BITSHIFT_LEFT";
    arithmetic[arithmetic["BITSIGNEDSHIFT_RIGHT"] = 5] = "BITSIGNEDSHIFT_RIGHT";
    arithmetic[arithmetic["BITSHIFT_RIGHT"] = 6] = "BITSHIFT_RIGHT";
    arithmetic[arithmetic["BIT_AND"] = 7] = "BIT_AND";
    arithmetic[arithmetic["BIT_OR"] = 8] = "BIT_OR";
    arithmetic[arithmetic["BIT_XOR"] = 9] = "BIT_XOR";
    arithmetic[arithmetic["BIT_NOT"] = 10] = "BIT_NOT";
})(arithmetic || (arithmetic = {
}));
var Direction;
(function(Direction) {
    Direction[Direction["topLeft"] = 0] = "topLeft";
    Direction[Direction["top"] = 1] = "top";
    Direction[Direction["topRight"] = 2] = "topRight";
    Direction[Direction["left"] = 3] = "left";
    Direction[Direction["right"] = 4] = "right";
    Direction[Direction["bottomLeft"] = 5] = "bottomLeft";
    Direction[Direction["bottom"] = 6] = "bottom";
    Direction[Direction["bottomRight"] = 7] = "bottomRight";
})(Direction || (Direction = {
}));
function indexByCoordinates(x, y, w) {
    return y * w + x;
}
function coordinatesByIndex(i, width) {
    let x = Math.floor(i % width);
    let y = Math.floor(i / width);
    return [
        x,
        y
    ];
}
function getNeighboringPixelIndex(direction, from, width) {
    switch(direction){
        case Direction.left:
            {
                return from - 1;
            }
        case Direction.right:
            {
                return from + 1;
            }
        case Direction.topLeft:
            {
                const [x, y] = coordinatesByIndex(from, width);
                return indexByCoordinates(x - 1, y - 1, width);
            }
        case Direction.top:
            {
                const [x, y] = coordinatesByIndex(from, width);
                return indexByCoordinates(x, y - 1, width);
            }
        case Direction.topRight:
            {
                const [x, y] = coordinatesByIndex(from, width);
                return indexByCoordinates(x + 1, y - 1, width);
            }
        case Direction.bottomRight:
            {
                const [x, y] = coordinatesByIndex(from, width);
                return indexByCoordinates(x + 1, y + 1, width);
            }
        case Direction.bottom:
            {
                const [x, y] = coordinatesByIndex(from, width);
                return indexByCoordinates(x, y + 1, width);
            }
        case Direction.bottomLeft:
            {
                const [x, y] = coordinatesByIndex(from, width);
                return indexByCoordinates(x - 1, y + 1, width);
            }
        default:
            console.log("Invalid directional instruction");
    }
    return 0;
}
function plotLineLow(_this, x0, y0, x1, y1) {
    const dx = x1 - x0;
    let dy = y1 - y0;
    let yi = 1;
    const color = _this.getRegister("COL");
    if (dy < 0) {
        yi = -1;
        dy = -dy;
    }
    let D = 2 * dy - dx;
    let y = y0;
    for(let x = x0; x < x1 + 1; x++){
        _this.setPixelColor(indexByCoordinates(x, y, _this.image.width), color);
        if (D > 0) {
            y = y + yi;
            D = D + 2 * (dy - dx);
        } else {
            D = D + 2 * dy;
        }
    }
}
function plotLineHigh(_this, x0, y0, x1, y1) {
    const color = _this.getRegister("COL");
    let dx = x1 - x0;
    const dy = y1 - y0;
    let xi = 1;
    if (dx < 0) {
        xi = -1;
        dx = -dx;
    }
    let D = 2 * dx - dy;
    let x = x0;
    for(let y = y0; y < y1 + 1; y++){
        _this.setPixelColor(indexByCoordinates(x, y, _this.image.width), color);
        if (D > 0) {
            x = x + xi;
            D = D + 2 * (dx - dy);
        } else {
            D = D + 2 * dx;
        }
    }
}
function drawLine(_this, x0, y0, x1, y1) {
    if (Math.abs(y1 - y0) < Math.abs(x1 - x0)) {
        if (x0 > x1) plotLineLow(_this, x1, y1, x0, y0);
        else plotLineLow(_this, x0, y0, x1, y1);
    } else {
        if (y0 > y1) plotLineHigh(_this, x1, y1, x0, y0);
        else plotLineHigh(_this, x0, y0, x1, y1);
    }
}
function combineRGB(input) {
    return (input[0] & 255) << 16 | (input[1] & 255) << 8 | input[2] & 255;
}
function spreadRGB(input) {
    let red = input >> 16 & 255;
    let green = input >> 8 & 255;
    let blue = input & 255;
    return [
        red,
        green,
        blue
    ];
}
function modifyLuminosity(by, color) {
    let [r, g, b] = spreadRGB(color);
    r += by;
    g += by;
    b += by;
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    return combineRGB([
        r,
        g,
        b
    ]);
}
function sleep(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms)
    );
}
function seeds(_this, index, liveColor, deadColor) {
    const currentColor = _this.getPixelColor(index);
    const color = (idx)=>{
        return _this.getPixelColor(idx);
    };
    if (currentColor === deadColor) {
        const topLeft = color(getNeighboringPixelIndex(Direction.topLeft, index, _this.image.width));
        const top = color(getNeighboringPixelIndex(Direction.top, index, _this.image.width));
        const topRight = color(getNeighboringPixelIndex(Direction.topRight, index, _this.image.width));
        const left = color(getNeighboringPixelIndex(Direction.left, index, _this.image.width));
        const right = color(getNeighboringPixelIndex(Direction.right, index, _this.image.width));
        const bottomLeft = color(getNeighboringPixelIndex(Direction.bottomLeft, index, _this.image.width));
        const bottom = color(getNeighboringPixelIndex(Direction.bottom, index, _this.image.width));
        const bottomRight = color(getNeighboringPixelIndex(Direction.bottomRight, index, _this.image.width));
        const onNeighbors = [
            topLeft,
            top,
            topRight,
            left,
            right,
            bottomLeft,
            bottom,
            bottomRight, 
        ].reduce((prev, curr)=>{
            prev += curr === liveColor ? 1 : 0;
            return prev;
        }, 0);
        if (onNeighbors === 2) {
            _this.setPixelColor(index, liveColor);
        } else {
            _this.setPixelColor(index, deadColor);
        }
    } else {
        _this.setPixelColor(index, deadColor);
    }
}
var moveType;
(function(moveType) {
    moveType[moveType["MOV_LIT_REG"] = 0] = "MOV_LIT_REG";
    moveType[moveType["MOV_REG_REG"] = 1] = "MOV_REG_REG";
    moveType[moveType["MOV_REG_MEM"] = 2] = "MOV_REG_MEM";
    moveType[moveType["MOV_MEM_REG"] = 3] = "MOV_MEM_REG";
    moveType[moveType["MOV_LIT_MEM"] = 4] = "MOV_LIT_MEM";
    moveType[moveType["MOV_MEM_MEM"] = 5] = "MOV_MEM_MEM";
})(moveType || (moveType = {
}));
var SMoveType;
(function(SMoveType) {
    SMoveType[SMoveType["MOV_SLIT_REG"] = 0] = "MOV_SLIT_REG";
    SMoveType[SMoveType["MOV_SREG_REG"] = 1] = "MOV_SREG_REG";
    SMoveType[SMoveType["MOV_SREG_MEM"] = 2] = "MOV_SREG_MEM";
    SMoveType[SMoveType["MOV_SMEM_REG"] = 3] = "MOV_SMEM_REG";
    SMoveType[SMoveType["MOV_SLIT_MEM"] = 4] = "MOV_SLIT_MEM";
})(SMoveType || (SMoveType = {
}));
function executeMove(_this, param) {
    [
        ()=>{
            const literal = param[2];
            const register = param[3];
            _this.setRegisterAt(register, literal);
        },
        ()=>{
            const registerFrom = param[2];
            const registerTo = param[3];
            const value = _this.getRegisterAt(registerFrom);
            _this.setRegisterAt(registerTo, value);
        },
        ()=>{
            const registerFrom = param[2];
            const address = param[3];
            const value = _this.getRegisterAt(registerFrom);
            _this.setMemoryAt(address, value);
        },
        ()=>{
            const address = param[2];
            const registerTo = param[3];
            const value = _this.getMemoryAt(address);
            _this.setRegisterAt(registerTo, value);
        },
        ()=>{
            const value = param[2];
            const address = param[3];
            _this.setMemoryAt(address, value);
        },
        ()=>{
            const addressFrom = param[2];
            const addressTo = param[3];
            const value = _this.getMemoryAt(addressFrom);
            _this.setMemoryAt(addressTo, value);
        }, 
    ][param[1]]();
}
function executeSignedMove(_this, param) {
    switch(param[1]){
        case SMoveType.MOV_SLIT_REG:
            {
                const literal = param[2];
                const register = param[3];
                console.log(literal, register);
                _this.setSignedRegisterAt(register, literal);
                break;
            }
        case SMoveType.MOV_SREG_REG:
            {
                const registerFrom = param[2];
                const registerTo = param[3];
                const value = _this.getSignedRegisterAt(registerFrom);
                _this.setSignedRegisterAt(registerTo, value);
                break;
            }
        case SMoveType.MOV_SREG_MEM:
            {
                const registerFrom = param[2];
                const address = param[3];
                const value = _this.getSignedRegisterAt(registerFrom);
                _this.setSignedMemoryAt(address, value);
                break;
            }
        case SMoveType.MOV_SMEM_REG:
            {
                const address = param[2];
                const registerTo = param[3];
                const value = _this.getSignedMemoryAt(address);
                _this.setSignedRegisterAt(registerTo, value);
                break;
            }
        case SMoveType.MOV_SLIT_MEM:
            {
                const value = param[2];
                const address = param[3];
                _this.setSignedMemoryAt(address, value);
                break;
            }
    }
}
var additionType;
(function(additionType) {
    additionType[additionType["ADD_REG_REG"] = 0] = "ADD_REG_REG";
    additionType[additionType["ADD_LIT_REG"] = 1] = "ADD_LIT_REG";
    additionType[additionType["ADD_REG_LIT"] = 2] = "ADD_REG_LIT";
    additionType[additionType["ADD_LIT_MEM"] = 3] = "ADD_LIT_MEM";
    additionType[additionType["ADD_REG_MEM"] = 4] = "ADD_REG_MEM";
    additionType[additionType["ADD_LIT_LIT"] = 5] = "ADD_LIT_LIT";
    additionType[additionType["ADD_MEM_MEM"] = 6] = "ADD_MEM_MEM";
})(additionType || (additionType = {
}));
var subtractionType;
(function(subtractionType) {
    subtractionType[subtractionType["SUB_REG_REG"] = 0] = "SUB_REG_REG";
    subtractionType[subtractionType["SUB_LIT_REG"] = 1] = "SUB_LIT_REG";
    subtractionType[subtractionType["SUB_REG_LIT"] = 2] = "SUB_REG_LIT";
    subtractionType[subtractionType["SUB_LIT_MEM"] = 3] = "SUB_LIT_MEM";
    subtractionType[subtractionType["SUB_REG_MEM"] = 4] = "SUB_REG_MEM";
    subtractionType[subtractionType["SUB_MEM_REG"] = 5] = "SUB_MEM_REG";
    subtractionType[subtractionType["SUB_MEM_LIT"] = 6] = "SUB_MEM_LIT";
    subtractionType[subtractionType["SUB_MEM_MEM"] = 7] = "SUB_MEM_MEM";
})(subtractionType || (subtractionType = {
}));
var multiplicationType;
(function(multiplicationType) {
    multiplicationType[multiplicationType["MUL_REG_REG"] = 0] = "MUL_REG_REG";
    multiplicationType[multiplicationType["MUL_LIT_REG"] = 1] = "MUL_LIT_REG";
    multiplicationType[multiplicationType["MUL_LIT_MEM"] = 2] = "MUL_LIT_MEM";
    multiplicationType[multiplicationType["MUL_REG_MEM"] = 3] = "MUL_REG_MEM";
    multiplicationType[multiplicationType["MUL_MEM_REG"] = 4] = "MUL_MEM_REG";
    multiplicationType[multiplicationType["MUL_MEM_LIT"] = 5] = "MUL_MEM_LIT";
    multiplicationType[multiplicationType["MUL_REG_LIT"] = 6] = "MUL_REG_LIT";
    multiplicationType[multiplicationType["MUL_LIT_LIT"] = 7] = "MUL_LIT_LIT";
    multiplicationType[multiplicationType["MUL_MEM_MEM"] = 8] = "MUL_MEM_MEM";
})(multiplicationType || (multiplicationType = {
}));
function subtraction(_this, param) {
    return [
        ()=>{
            const r1 = param[2];
            const r2 = param[3];
            const lhs = _this.getRegisterAt(r1);
            const rhs = _this.getRegisterAt(r2);
            _this.setRegister("acc", lhs - rhs);
        },
        ()=>{
            const literal = param[2];
            const r1 = param[3];
            const r1V = _this.getRegisterAt(r1);
            _this.setRegister("acc", literal - r1V);
        },
        ()=>{
            const r1 = param[2];
            const literal = param[3];
            const r1V = _this.getRegisterAt(r1);
            _this.setRegister("acc", r1V - literal);
        },
        ()=>{
            const literal = param[2];
            const mem = param[3];
            const memV = _this.getMemoryAt(mem);
            _this.setRegister("acc", literal - memV);
        },
        ()=>{
            const r1 = param[2];
            const mem = param[3];
            const r1V = _this.getRegisterAt(r1);
            const memV = _this.getMemoryAt(mem);
            _this.setRegister("acc", r1V - memV);
        },
        ()=>{
            const mem = param[2];
            const r1 = param[3];
            const memV = _this.getMemoryAt(mem);
            const r1V = _this.getRegisterAt(r1);
            _this.setRegister("acc", memV - r1V);
        },
        ()=>{
            const memV = _this.getMemoryAt(param[2]);
            _this.setRegister("acc", memV - param[3]);
        },
        ()=>{
            const mem1V = _this.getMemoryAt(param[2]);
            const mem2V = _this.getMemoryAt(param[3]);
            _this.setRegister("acc", mem1V - mem2V);
        }, 
    ][param[1]]();
}
function addition(_this, param) {
    return [
        ()=>{
            const r1 = param[2];
            const r2 = param[3];
            const lhs = _this.getRegisterAt(r1);
            const rhs = _this.getRegisterAt(r2);
            _this.setRegister("acc", lhs + rhs);
        },
        ()=>{
            const literal = param[2];
            const r1 = param[3];
            const r1V = _this.getRegisterAt(r1);
            _this.setRegister("acc", literal + r1V);
        },
        ()=>{
            const r1 = param[2];
            const literal = param[3];
            const r1V = _this.getRegisterAt(r1);
            _this.setRegister("acc", literal + r1V);
        },
        ()=>{
            const literal = param[2];
            const mem = param[3];
            const memV = _this.getMemoryAt(mem);
            _this.setRegister("acc", literal + memV);
        },
        ()=>{
            const r1 = param[2];
            const mem = param[3];
            const r1V = _this.getRegisterAt(r1);
            const memV = _this.getMemoryAt(mem);
            _this.setRegister("acc", r1V + memV);
        },
        ()=>{
            const literal = param[2];
            const literal2 = param[3];
            _this.setRegister("acc", literal + literal2);
        },
        ()=>{
            const mem1 = param[2];
            const mem2 = param[3];
            const mem1V = _this.getMemoryAt(mem1);
            const mem2V = _this.getMemoryAt(mem2);
            _this.setRegister("acc", mem1V + mem2V);
        }
    ][param[1]]();
}
function multiplication(_this, param) {
    return [
        ()=>{
            const r1 = param[2];
            const r2 = param[3];
            const lhs = _this.getRegisterAt(r1);
            const rhs = _this.getRegisterAt(r2);
            _this.setRegister("acc", lhs * rhs);
        },
        ()=>{
            const literal = param[2];
            const r1 = param[3];
            const r1V = _this.getRegisterAt(r1);
            _this.setRegister("acc", literal * r1V);
        },
        ()=>{
            const literal = param[2];
            const mem = param[3];
            const memV = _this.getMemoryAt(mem);
            _this.setRegister("acc", literal * memV);
        },
        ()=>{
            const r1 = param[2];
            const mem = param[3];
            const r1V = _this.getRegisterAt(r1);
            const memV = _this.getMemoryAt(mem);
            _this.setRegister("acc", r1V * memV);
        },
        ()=>{
            const mem = param[2];
            const r1 = param[3];
            const memV = _this.getMemoryAt(mem);
            const r1V = _this.getRegisterAt(r1);
            _this.setRegister("acc", memV * r1V);
        },
        ()=>{
            const mem = param[2];
            const literal = param[3];
            const memV = _this.getMemoryAt(mem);
            _this.setRegister("acc", memV * literal);
        },
        ()=>{
            const r1 = param[2];
            const literal = param[3];
            const r1V = _this.getRegisterAt(r1);
            _this.setRegister("acc", r1V * literal);
        },
        ()=>{
            const literal = param[2];
            const literal2 = param[3];
            _this.setRegister("acc", literal * literal2);
        },
        ()=>{
            const mem1 = param[2];
            const mem2 = param[3];
            const mem1V = _this.getMemoryAt(mem1);
            const mem2V = _this.getMemoryAt(mem2);
            _this.setRegister("acc", mem1V * mem2V);
        }, 
    ][param[1]]();
}
var shiftType;
(function(shiftType) {
    shiftType[shiftType["LSF_REG_LIT"] = 0] = "LSF_REG_LIT";
    shiftType[shiftType["LSF_REG_REG"] = 1] = "LSF_REG_REG";
    shiftType[shiftType["LSF_REG_MEM"] = 2] = "LSF_REG_MEM";
    shiftType[shiftType["LSF_MEM_LIT"] = 3] = "LSF_MEM_LIT";
    shiftType[shiftType["LSF_MEM_REG"] = 4] = "LSF_MEM_REG";
    shiftType[shiftType["RSF_REG_LIT"] = 5] = "RSF_REG_LIT";
    shiftType[shiftType["RSF_REG_REG"] = 6] = "RSF_REG_REG";
    shiftType[shiftType["RSF_REG_MEM"] = 7] = "RSF_REG_MEM";
    shiftType[shiftType["RSF_MEM_LIT"] = 8] = "RSF_MEM_LIT";
    shiftType[shiftType["RSF_MEM_REG"] = 9] = "RSF_MEM_REG";
})(shiftType || (shiftType = {
}));
var andType;
(function(andType) {
    andType[andType["AND_REG_LIT"] = 0] = "AND_REG_LIT";
    andType[andType["AND_REG_REG"] = 1] = "AND_REG_REG";
    andType[andType["AND_REG_MEM"] = 2] = "AND_REG_MEM";
    andType[andType["AND_MEM_REG"] = 3] = "AND_MEM_REG";
    andType[andType["AND_LIT_MEM"] = 4] = "AND_LIT_MEM";
    andType[andType["AND_MEM_LIT"] = 5] = "AND_MEM_LIT";
})(andType || (andType = {
}));
var orType;
(function(orType) {
    orType[orType["OR_REG_LIT"] = 0] = "OR_REG_LIT";
    orType[orType["OR_REG_REG"] = 1] = "OR_REG_REG";
    orType[orType["OR_LIT_MEM"] = 2] = "OR_LIT_MEM";
    orType[orType["OR_REG_MEM"] = 3] = "OR_REG_MEM";
    orType[orType["XOR_REG_LIT"] = 4] = "XOR_REG_LIT";
    orType[orType["XOR_REG_REG"] = 5] = "XOR_REG_REG";
    orType[orType["XOR_LIT_MEM"] = 6] = "XOR_LIT_MEM";
    orType[orType["XOR_REG_MEM"] = 7] = "XOR_REG_MEM";
})(orType || (orType = {
}));
function bitwiseShift(_this, param) {
    [
        ()=>{
            const r1 = param[2];
            const literal = param[3];
            const oldValue = _this.getRegisterAt(r1);
            _this.setRegisterAt(r1, oldValue << literal);
        },
        ()=>{
            const r1 = param[2];
            const r2 = param[3];
            const oldValue = _this.getRegisterAt(r1);
            _this.setRegisterAt(r1, oldValue << _this.getRegisterAt(r2));
        },
        ()=>{
            const r1 = param[2];
            const mem = param[3];
            const oldValue = _this.getRegisterAt(r1);
            _this.setRegisterAt(r1, oldValue << _this.getMemoryAt(mem));
        },
        ()=>{
            const mem = param[2];
            const literal = param[3];
            const oldValue = _this.getMemoryAt(mem);
            _this.setMemoryAt(mem, oldValue << literal);
        },
        ()=>{
            const mem = param[2];
            const r2 = param[3];
            const oldValue = _this.getMemoryAt(mem);
            _this.setMemoryAt(mem, oldValue << _this.getRegisterAt(r2));
        },
        ()=>{
            const r1 = param[2];
            const literal = param[3];
            const oldValue = _this.getRegisterAt(r1);
            _this.setRegisterAt(r1, oldValue >> literal);
        },
        ()=>{
            const r1 = param[2];
            const r2 = param[3];
            const oldValue = _this.getRegisterAt(r1);
            _this.setRegisterAt(r1, oldValue >> _this.getRegisterAt(r2));
        },
        ()=>{
            const r1 = param[2];
            const mem = param[3];
            const oldValue = _this.getRegisterAt(r1);
            _this.setRegisterAt(r1, oldValue >> _this.getMemoryAt(mem));
        },
        ()=>{
            const mem = param[2];
            const literal = param[3];
            const oldValue = _this.getMemoryAt(mem);
            _this.setMemoryAt(mem, oldValue >> literal);
        },
        ()=>{
            const mem = param[2];
            const r2 = param[3];
            const oldValue = _this.getMemoryAt(mem);
            _this.setMemoryAt(mem, oldValue >> _this.getRegisterAt(r2));
        }, 
    ][param[1]]();
}
function bitwiseAND(_this, param) {
    [
        ()=>{
            const r1 = param[2];
            const literal = param[3];
            const r1V = _this.getRegisterAt(r1);
            _this.setRegister("acc", r1V & literal);
        },
        ()=>{
            const r1 = param[2];
            const r2 = param[3];
            const r1V = _this.getRegisterAt(r1);
            const r2V = _this.getRegisterAt(r2);
            _this.setRegister("acc", r1V & r2V);
        },
        ()=>{
            const r1 = param[2];
            const mem = param[3];
            const r1V = _this.getRegisterAt(r1);
            const r2V = _this.getMemoryAt(mem);
            _this.setRegister("acc", r1V & r2V);
        },
        ()=>{
            const mem = param[2];
            const r2 = param[3];
            const r2V = _this.getRegisterAt(r2);
            const memV = _this.getMemoryAt(mem);
            _this.setRegister("acc", memV & r2V);
        },
        ()=>{
            const literal = param[2];
            const mem = param[3];
            const memV = _this.getMemoryAt(mem);
            _this.setRegister("acc", memV & literal);
        },
        ()=>{
            const mem = param[2];
            const literal = param[3];
            const memV = _this.getMemoryAt(mem);
            _this.setRegister("acc", memV & literal);
        }
    ][param[1]]();
}
function bitwiseOR(_this, param) {
    [
        ()=>{
            const r1 = param[2];
            const literal = param[3];
            const r1V = _this.getRegisterAt(r1);
            _this.setRegister("acc", r1V | literal);
        },
        ()=>{
            const r1 = param[2];
            const r2 = param[3];
            const r1V = _this.getRegisterAt(r1);
            const r2V = _this.getRegisterAt(r2);
            _this.setRegister("acc", r1V | r2V);
        },
        ()=>{
            const literal = param[2];
            const mem = param[3];
            const memV = _this.getMemoryAt(mem);
            _this.setRegister("acc", memV | literal);
        },
        ()=>{
            const r1 = param[2];
            const mem = param[3];
            const r1V = _this.getRegisterAt(r1);
            const r2V = _this.getMemoryAt(mem);
            _this.setRegister("acc", r1V | r2V);
        },
        ()=>{
            const r1 = param[2];
            const literal = param[3];
            const r1V = _this.getRegisterAt(r1);
            _this.setRegister("acc", r1V ^ literal);
        },
        ()=>{
            const r1 = param[2];
            const r2 = param[3];
            const r1V = _this.getRegisterAt(r1);
            const r2V = _this.getRegisterAt(r2);
            _this.setRegister("acc", r1V ^ r2V);
        },
        ()=>{
            const literal = param[2];
            const mem = param[3];
            const memV = _this.getMemoryAt(mem);
            _this.setRegister("acc", memV ^ literal);
        },
        ()=>{
            const r1 = param[2];
            const mem = param[3];
            const r1V = _this.getRegisterAt(r1);
            const memV = _this.getMemoryAt(mem);
            _this.setRegister("acc", memV ^ r1V);
        }, 
    ][param[1]]();
}
var AccJumpType;
(function(AccJumpType) {
    AccJumpType[AccJumpType["JNE_LIT"] = 0] = "JNE_LIT";
    AccJumpType[AccJumpType["JNE_REG"] = 1] = "JNE_REG";
    AccJumpType[AccJumpType["JEQ_REG"] = 2] = "JEQ_REG";
    AccJumpType[AccJumpType["JEQ_LIT"] = 3] = "JEQ_LIT";
    AccJumpType[AccJumpType["JLT_REG"] = 4] = "JLT_REG";
    AccJumpType[AccJumpType["JLT_LIT"] = 5] = "JLT_LIT";
    AccJumpType[AccJumpType["JGT_REG"] = 6] = "JGT_REG";
    AccJumpType[AccJumpType["JGT_LIT"] = 7] = "JGT_LIT";
    AccJumpType[AccJumpType["JLE_REG"] = 8] = "JLE_REG";
    AccJumpType[AccJumpType["JLE_LIT"] = 9] = "JLE_LIT";
    AccJumpType[AccJumpType["JGE_REG"] = 10] = "JGE_REG";
    AccJumpType[AccJumpType["JGE_LIT"] = 11] = "JGE_LIT";
})(AccJumpType || (AccJumpType = {
}));
var CallType;
(function(CallType) {
    CallType[CallType["CAL_LIT"] = 0] = "CAL_LIT";
    CallType[CallType["CAL_REG"] = 1] = "CAL_REG";
    CallType[CallType["CAL_MEM"] = 2] = "CAL_MEM";
})(CallType || (CallType = {
}));
function jumpBasedOnAcc(_this, param) {
    [
        ()=>{
            const value = param[2];
            const address = param[3];
            if (value !== _this.getRegister("acc")) {
                _this.pushIp();
                _this.setRegister("ip", address);
            }
        },
        ()=>{
            const value = _this.getRegisterAt(param[2]);
            const address = param[3];
            if (value !== _this.getRegister("acc")) {
                _this.pushIp();
                _this.setRegister("ip", address);
            }
        },
        ()=>{
            const value = _this.getRegisterAt(param[2]);
            const address = param[3];
            if (value === _this.getRegister("acc")) {
                _this.pushIp();
                _this.setRegister("ip", address);
            }
        },
        ()=>{
            const value = param[2];
            const address = param[3];
            if (value === _this.getRegister("acc")) {
                _this.pushIp();
                _this.setRegister("ip", address);
            }
        },
        ()=>{
            const value = _this.getRegisterAt(param[2]);
            const address = param[3];
            if (value < _this.getRegister("acc")) {
                _this.pushIp();
                _this.setRegister("ip", address);
            }
        },
        ()=>{
            const value = param[2];
            const address = param[3];
            if (value < _this.getRegister("acc")) {
                _this.pushIp();
                _this.setRegister("ip", address);
            }
        },
        ()=>{
            const value = _this.getRegisterAt(param[2]);
            const address = param[3];
            if (value > _this.getRegister("acc")) {
                _this.pushIp();
                _this.setRegister("ip", address);
            }
        },
        ()=>{
            const value = param[2];
            const address = param[3];
            if (value > _this.getRegister("acc")) {
                _this.pushIp();
                _this.setRegister("ip", address);
            }
        },
        ()=>{
            const value = _this.getRegisterAt(param[2]);
            const address = param[3];
            if (value <= _this.getRegister("acc")) {
                _this.pushIp();
                _this.setRegister("ip", address);
            }
        },
        ()=>{
            const value = param[2];
            const address = param[3];
            if (value <= _this.getRegister("acc")) {
                _this.pushIp();
                _this.setRegister("ip", address);
            }
        },
        ()=>{
            const value = _this.getRegisterAt(param[2]);
            const address = param[3];
            if (value >= _this.getRegister("acc")) {
                _this.pushIp();
                _this.setRegister("ip", address);
            }
        },
        ()=>{
            const value = param[2];
            const address = param[3];
            if (value >= _this.getRegister("acc")) {
                _this.pushIp();
                _this.setRegister("ip", address);
            }
        }
    ][param[1]]();
}
function callALocation(_this, param) {
    [
        ()=>{
            const address = param[2];
            _this.pushIp();
            _this.setRegister("ip", address);
        },
        ()=>{
            const address = _this.getRegisterAt(param[2]);
            _this.pushIp();
            _this.setRegister("ip", address);
        },
        ()=>{
            const address = _this.getMemoryAt(param[2]);
            _this.pushIp();
            _this.setRegister("ip", address);
        }
    ][param[1]]();
}
var RandomType;
(function(RandomType) {
    RandomType[RandomType["RAND_LIT_LIT"] = 0] = "RAND_LIT_LIT";
    RandomType[RandomType["RAND_REG_REG"] = 1] = "RAND_REG_REG";
    RandomType[RandomType["RAND_MEM_MEM"] = 2] = "RAND_MEM_MEM";
})(RandomType || (RandomType = {
}));
function randomToAccumulator(_this, param) {
    switch(param[1]){
        case RandomType.RAND_LIT_LIT:
            {
                const min = Math.ceil(param[2]);
                const max = Math.floor(param[3]);
                _this.setRegister("acc", Math.floor(Math.random() * (max - min + 1) + min));
                break;
            }
        case RandomType.RAND_REG_REG:
            {
                const min = Math.ceil(_this.getRegisterAt(param[2]));
                const max = Math.floor(_this.getRegisterAt(param[3]));
                _this.setRegister("acc", Math.floor(Math.random() * (max - min + 1) + min));
                break;
            }
        case RandomType.RAND_MEM_MEM:
            {
                const min = Math.ceil(_this.getMemoryAt(param[2]));
                const max = Math.floor(_this.getMemoryAt(param[3]));
                _this.setMemoryAt(param[4], Math.floor(Math.random() * (max - min + 1) + min));
                break;
            }
    }
}
var PixelModificationType;
(function(PixelModificationType) {
    PixelModificationType[PixelModificationType["MODIFY_PIXEL_REG_REG_REG"] = 0] = "MODIFY_PIXEL_REG_REG_REG";
    PixelModificationType[PixelModificationType["MODIFY_PIXEL_LIT_LIT_LIT"] = 1] = "MODIFY_PIXEL_LIT_LIT_LIT";
    PixelModificationType[PixelModificationType["MODIFY_PIXEL_MEM_MEM_MEM"] = 2] = "MODIFY_PIXEL_MEM_MEM_MEM";
})(PixelModificationType || (PixelModificationType = {
}));
var LuminosityModificationType;
(function(LuminosityModificationType) {
    LuminosityModificationType[LuminosityModificationType["MODIFY_PIXEL_LUMINOSITY_REG"] = 0] = "MODIFY_PIXEL_LUMINOSITY_REG";
    LuminosityModificationType[LuminosityModificationType["MODIFY_PIXEL_LUMINOSITY_MEM"] = 1] = "MODIFY_PIXEL_LUMINOSITY_MEM";
    LuminosityModificationType[LuminosityModificationType["MODIFY_PIXEL_LUMINOSITY_LIT"] = 2] = "MODIFY_PIXEL_LUMINOSITY_LIT";
    LuminosityModificationType[LuminosityModificationType["MODIFY_IMAGE_LUMINOSITY_REG"] = 3] = "MODIFY_IMAGE_LUMINOSITY_REG";
    LuminosityModificationType[LuminosityModificationType["MODIFY_IMAGE_LUMINOSITY_MEM"] = 4] = "MODIFY_IMAGE_LUMINOSITY_MEM";
    LuminosityModificationType[LuminosityModificationType["MODIFY_IMAGE_LUMINOSITY_LIT"] = 5] = "MODIFY_IMAGE_LUMINOSITY_LIT";
})(LuminosityModificationType || (LuminosityModificationType = {
}));
function modifyPixel(_this, params) {
    switch(params[1]){
        case PixelModificationType.MODIFY_PIXEL_REG_REG_REG:
            {
                const x = _this.getRegisterAt(params[2]);
                const y = _this.getRegisterAt(params[3]);
                const color = _this.getRegisterAt(params[4]);
                const index = indexByCoordinates(x, y, _this.image.width);
                _this.setPixelColor(index, color);
                break;
            }
        case PixelModificationType.MODIFY_PIXEL_LIT_LIT_LIT:
            {
                const x = params[2];
                const y = params[3];
                const color = params[4];
                const index = indexByCoordinates(x, y, _this.image.width);
                _this.setPixelColor(index, color);
                break;
            }
        case PixelModificationType.MODIFY_PIXEL_MEM_MEM_MEM:
            {
                const x = _this.getMemoryAt(params[2]);
                const y = _this.getMemoryAt(params[3]);
                const color = _this.getMemoryAt(params[4]);
                const index = indexByCoordinates(x, y, _this.image.width);
                _this.setPixelColor(index, color);
                break;
            }
    }
}
function modifyLuminosityIns(_this, params) {
    switch(params[1]){
        case LuminosityModificationType.MODIFY_PIXEL_LUMINOSITY_REG:
            {
                const luminosity = _this.getRegisterAt(params[2]);
                const x = _this.getRegister("x");
                const y = _this.getRegister("y");
                const index = indexByCoordinates(x, y, _this.image.width);
                _this.setPixelColor(index, modifyLuminosity(luminosity, _this.getPixelColor(index)));
                break;
            }
        case LuminosityModificationType.MODIFY_PIXEL_LUMINOSITY_MEM:
            {
                const luminosity = _this.getMemoryAt(params[2]);
                const x = _this.getRegister("x");
                const y = _this.getRegister("y");
                const index = indexByCoordinates(x, y, _this.image.width);
                _this.setPixelColor(index, modifyLuminosity(luminosity, _this.getPixelColor(index)));
                break;
            }
        case LuminosityModificationType.MODIFY_PIXEL_LUMINOSITY_LIT:
            {
                const luminosity = params[2];
                const x = _this.getRegister("x");
                const y = _this.getRegister("y");
                const index = indexByCoordinates(x, y, _this.image.width);
                _this.setPixelColor(index, modifyLuminosity(luminosity, _this.getPixelColor(index)));
                break;
            }
        case LuminosityModificationType.MODIFY_IMAGE_LUMINOSITY_REG:
            {
                const luminosity = _this.getRegisterAt(params[2]);
                for(let i = 0; i < _this.imageCopy.length; i++){
                    _this.setPixelColor(i, modifyLuminosity(luminosity, _this.getPixelColor(i)));
                }
                break;
            }
        case LuminosityModificationType.MODIFY_IMAGE_LUMINOSITY_MEM:
            {
                const luminosity = _this.getMemoryAt(params[2]);
                for(let i = 0; i < _this.imageCopy.length; i++){
                    _this.setPixelColor(i, modifyLuminosity(luminosity, _this.getPixelColor(i)));
                }
                break;
            }
        case LuminosityModificationType.MODIFY_IMAGE_LUMINOSITY_LIT:
            {
                const luminosity = params[2];
                for(let i = 0; i < _this.imageCopy.length; i++){
                    _this.setPixelColor(i, modifyLuminosity(luminosity, _this.getPixelColor(i)));
                }
                break;
            }
    }
}
var NeighborRetrievalType;
(function(NeighborRetrievalType) {
    NeighborRetrievalType[NeighborRetrievalType["NEIGHBORING_PIXEL_INDEX_TO_REG"] = 0] = "NEIGHBORING_PIXEL_INDEX_TO_REG";
    NeighborRetrievalType[NeighborRetrievalType["NEIGHBORING_PIXEL_INDEX_FROM_REG_TO_REG"] = 1] = "NEIGHBORING_PIXEL_INDEX_FROM_REG_TO_REG";
})(NeighborRetrievalType || (NeighborRetrievalType = {
}));
var PixelColorByIndexType;
(function(PixelColorByIndexType) {
    PixelColorByIndexType[PixelColorByIndexType["FETCH_PIXEL_COLOR_REG"] = 0] = "FETCH_PIXEL_COLOR_REG";
    PixelColorByIndexType[PixelColorByIndexType["FETCH_PIXEL_COLOR_MEM"] = 1] = "FETCH_PIXEL_COLOR_MEM";
    PixelColorByIndexType[PixelColorByIndexType["FETCH_PIXEL_COLOR_LIT"] = 2] = "FETCH_PIXEL_COLOR_LIT";
})(PixelColorByIndexType || (PixelColorByIndexType = {
}));
var PixelIndexFetchType;
(function(PixelIndexFetchType) {
    PixelIndexFetchType[PixelIndexFetchType["FETCH_PIXEL_INDEX_REG_REG"] = 0] = "FETCH_PIXEL_INDEX_REG_REG";
    PixelIndexFetchType[PixelIndexFetchType["FETCH_PIXEL_INDEX_LIT_LIT"] = 1] = "FETCH_PIXEL_INDEX_LIT_LIT";
    PixelIndexFetchType[PixelIndexFetchType["FETCH_PIXEL_INDEX_MEM_MEM"] = 2] = "FETCH_PIXEL_INDEX_MEM_MEM";
})(PixelIndexFetchType || (PixelIndexFetchType = {
}));
function fetchNeighboringPixel(_this, params) {
    const direction = params[2];
    switch(params[1]){
        case NeighborRetrievalType.NEIGHBORING_PIXEL_INDEX_TO_REG:
            {
                const currentPixel = params[3];
                const reg = params[4];
                const idx = getNeighboringPixelIndex(direction, currentPixel, _this.image.width);
                _this.setRegisterAt(reg, idx);
                return;
            }
        case NeighborRetrievalType.NEIGHBORING_PIXEL_INDEX_FROM_REG_TO_REG:
            {
                const currentPixel = _this.getRegisterAt(params[3]);
                const reg = params[4];
                const idx = getNeighboringPixelIndex(direction, currentPixel, _this.image.width);
                _this.setRegisterAt(reg, idx);
                return;
            }
    }
}
function fetchPixelIndex(_this, params) {
    switch(params[1]){
        case PixelIndexFetchType.FETCH_PIXEL_INDEX_REG_REG:
            {
                const x = _this.getRegisterAt(params[2]);
                const y = _this.getRegisterAt(params[3]);
                const reg = params[4];
                _this.setRegisterAt(reg, indexByCoordinates(x, y, _this.image.width));
                break;
            }
        case PixelIndexFetchType.FETCH_PIXEL_INDEX_LIT_LIT:
            {
                const x = params[2];
                const y = params[3];
                const reg = params[4];
                _this.setRegisterAt(reg, indexByCoordinates(x, y, _this.image.width));
                break;
            }
        case PixelIndexFetchType.FETCH_PIXEL_INDEX_MEM_MEM:
            {
                const x = _this.getMemoryAt(params[2]);
                const y = _this.getMemoryAt(params[3]);
                const reg = params[4];
                _this.setRegisterAt(reg, indexByCoordinates(x, y, _this.image.width));
                break;
            }
    }
}
var RGBConversionType;
(function(RGBConversionType) {
    RGBConversionType[RGBConversionType["RGB_TO_COLOR_LIT_LIT_LIT"] = 0] = "RGB_TO_COLOR_LIT_LIT_LIT";
    RGBConversionType[RGBConversionType["RGB_TO_COLOR_MEM_MEM_MEM"] = 1] = "RGB_TO_COLOR_MEM_MEM_MEM";
    RGBConversionType[RGBConversionType["RGB_TO_COLOR_REG_REG_REG"] = 2] = "RGB_TO_COLOR_REG_REG_REG";
})(RGBConversionType || (RGBConversionType = {
}));
function RGBConversion(_this, params) {
    switch(params[1]){
        case RGBConversionType.RGB_TO_COLOR_LIT_LIT_LIT:
            {
                const r = params[2];
                const g = params[3];
                const b = params[4];
                _this.setRegister("COL", combineRGB([
                    r,
                    g,
                    b
                ]));
                break;
            }
        case RGBConversionType.RGB_TO_COLOR_MEM_MEM_MEM:
            {
                const r = _this.getMemoryAt(params[2]);
                const g = _this.getMemoryAt(params[3]);
                const b = _this.getMemoryAt(params[4]);
                _this.setRegister("COL", combineRGB([
                    r,
                    g,
                    b
                ]));
                break;
            }
        case RGBConversionType.RGB_TO_COLOR_REG_REG_REG:
            {
                const r = _this.getRegisterAt(params[2]);
                const g = _this.getRegisterAt(params[3]);
                const b = _this.getRegisterAt(params[4]);
                _this.setRegister("COL", combineRGB([
                    r,
                    g,
                    b
                ]));
                break;
            }
    }
}
var ImageInfoFetchType;
(function(ImageInfoFetchType) {
    ImageInfoFetchType[ImageInfoFetchType["IMAGE_WIDTH_REG"] = 0] = "IMAGE_WIDTH_REG";
    ImageInfoFetchType[ImageInfoFetchType["IMAGE_WIDTH_MEM"] = 1] = "IMAGE_WIDTH_MEM";
    ImageInfoFetchType[ImageInfoFetchType["IMAGE_HEIGHT_REG"] = 2] = "IMAGE_HEIGHT_REG";
    ImageInfoFetchType[ImageInfoFetchType["IMAGE_HEIGHT_MEM"] = 3] = "IMAGE_HEIGHT_MEM";
    ImageInfoFetchType[ImageInfoFetchType["IMAGE_TOTAL_PIXELS_REG"] = 4] = "IMAGE_TOTAL_PIXELS_REG";
    ImageInfoFetchType[ImageInfoFetchType["IMAGE_TOTAL_PIXELS_MEM"] = 5] = "IMAGE_TOTAL_PIXELS_MEM";
})(ImageInfoFetchType || (ImageInfoFetchType = {
}));
function fetchImageInfo(_this, params) {
    [
        ()=>{
            const regToStoreIn = params[2];
            _this.setRegisterAt(regToStoreIn, _this.image.width);
        },
        ()=>{
            const memToStoreIn = params[2];
            _this.setMemoryAt(memToStoreIn, _this.image.width);
        },
        ()=>{
            const regToStoreIn = params[2];
            _this.setRegisterAt(regToStoreIn, _this.image.height);
        },
        ()=>{
            const memToStoreIn = params[2];
            _this.setMemoryAt(memToStoreIn, _this.image.height);
        },
        ()=>{
            const regToStoreIn = params[2];
            _this.setRegisterAt(regToStoreIn, _this.image.width * _this.image.height);
        },
        ()=>{
            const memToStoreIn = params[2];
            _this.setMemoryAt(memToStoreIn, _this.image.width * _this.image.height);
        }, 
    ][params[1]]();
}
var RectangleDrawingType;
(function(RectangleDrawingType) {
    RectangleDrawingType[RectangleDrawingType["DRAW_BOX_WLIT_HLIT"] = 0] = "DRAW_BOX_WLIT_HLIT";
    RectangleDrawingType[RectangleDrawingType["DRAW_BOX_WREG_HREG"] = 1] = "DRAW_BOX_WREG_HREG";
})(RectangleDrawingType || (RectangleDrawingType = {
}));
var ManualRectangleDrawingType;
(function(ManualRectangleDrawingType) {
    ManualRectangleDrawingType[ManualRectangleDrawingType["DRAW_BOX_LIT_LIT_LIT_LIT_LIT"] = 0] = "DRAW_BOX_LIT_LIT_LIT_LIT_LIT";
})(ManualRectangleDrawingType || (ManualRectangleDrawingType = {
}));
var DrawLineType;
(function(DrawLineType) {
    DrawLineType[DrawLineType["DRAW_LINE_P1REG_P2REG"] = 0] = "DRAW_LINE_P1REG_P2REG";
    DrawLineType[DrawLineType["DRAW_LINE_P1LIT_P2LIT"] = 1] = "DRAW_LINE_P1LIT_P2LIT";
})(DrawLineType || (DrawLineType = {
}));
var DrawCircleType;
(function(DrawCircleType) {
    DrawCircleType[DrawCircleType["DRAW_CIRCLE_LIT"] = 0] = "DRAW_CIRCLE_LIT";
    DrawCircleType[DrawCircleType["DRAW_CIRCLE_REG"] = 1] = "DRAW_CIRCLE_REG";
    DrawCircleType[DrawCircleType["DRAW_CIRCLE_MEM"] = 2] = "DRAW_CIRCLE_MEM";
})(DrawCircleType || (DrawCircleType = {
}));
function drawBox(_this, params) {
    const color = _this.getRegister("COL");
    const x = _this.getRegister("x");
    const y = _this.getRegister("y");
    const imageWidth = _this.image.width;
    const imageHeight = _this.image.height;
    switch(params[1]){
        case RectangleDrawingType.DRAW_BOX_WLIT_HLIT:
            {
                const width = params[2];
                const height = params[3];
                for(let tY = 0; tY <= height; tY++){
                    for(let tX = 0; tX <= width; tX++){
                        const nX = tX + x;
                        const nY = tY + y;
                        if (Math.min(nX, nY) < 1 || nX > imageWidth || nY > imageHeight) {
                            continue;
                        }
                        _this.setPixelColor(indexByCoordinates(nX, nY, imageWidth), color);
                    }
                }
                break;
            }
        case RectangleDrawingType.DRAW_BOX_WREG_HREG:
            {
                const width = _this.getRegisterAt(params[2]);
                const height = _this.getRegisterAt(params[3]);
                for(let tY = 0; tY <= height; tY++){
                    for(let tX = 0; tX <= width; tX++){
                        const nX = tX + x;
                        const nY = tY + y;
                        if (Math.min(nX, nY) < 1 || nX > imageWidth || nY > imageHeight) {
                            continue;
                        }
                        _this.setPixelColor(indexByCoordinates(nX, nY, imageWidth), color);
                    }
                }
            }
    }
}
function drawBoxManual(_this, params) {
    const imageWidth = _this.image.width;
    const imageHeight = _this.image.height;
    switch(params[1]){
        case ManualRectangleDrawingType.DRAW_BOX_LIT_LIT_LIT_LIT_LIT:
            {
                const x = params[2];
                const y = params[3];
                const width = params[4];
                const height = params[5];
                const color = params[6];
                for(let tY = 0; tY <= height; tY++){
                    for(let tX = 0; tX <= width; tX++){
                        const nX = tX + x;
                        const nY = tY + y;
                        if (Math.min(nX, nY) < 1 || nX > imageWidth || nY > imageHeight) {
                            continue;
                        }
                        _this.setPixelColor(indexByCoordinates(nX, nY, imageWidth), color);
                    }
                }
                break;
            }
    }
}
function drawLineP(_this, params) {
    switch(params[1]){
        case DrawLineType.DRAW_LINE_P1REG_P2REG:
            {
                const point1_x = _this.getRegisterAt(params[2]);
                const point1_y = _this.getRegisterAt(params[3]);
                const point2_x = _this.getMemoryAt(params[4]);
                const point2_y = _this.getMemoryAt(params[5]);
                drawLine(_this, point1_x, point1_y, point2_x, point2_y);
                break;
            }
        case DrawLineType.DRAW_LINE_P1LIT_P2LIT:
            {
                const point1_x = params[2];
                const point1_y = params[3];
                const point2_x = params[4];
                const point2_y = params[5];
                drawLine(_this, point1_x, point1_y, point2_x, point2_y);
                break;
            }
    }
}
function drawCircleA(_this, params) {
    const imageHeight = _this.image.height;
    const imageWidth = _this.image.width;
    switch(params[1]){
        case DrawCircleType.DRAW_CIRCLE_LIT:
            {
                const color = _this.getRegister("COL");
                const x = _this.getRegister("x");
                const y = _this.getRegister("y");
                const radius = params[2];
                const radSquared = radius ** 2;
                for(let currentY = Math.max(1, y - radius); currentY <= Math.min(y + radius, imageHeight); currentY++){
                    for(let currentX = Math.max(1, x - radius); currentX <= Math.min(x + radius, imageWidth); currentX++){
                        if ((currentX - x) ** 2 + (currentY - y) ** 2 < radSquared) {
                            _this.setPixelColor(indexByCoordinates(currentX, currentY, imageWidth), color);
                        }
                    }
                }
                break;
            }
        case DrawCircleType.DRAW_CIRCLE_REG:
            {
                const color = _this.getRegister("COL");
                const x = _this.getRegister("x");
                const y = _this.getRegister("y");
                const radius = _this.getRegisterAt(params[2]);
                const radSquared = radius ** 2;
                for(let currentY = Math.max(1, y - radius); currentY <= Math.min(y + radius, imageHeight); currentY++){
                    for(let currentX = Math.max(1, x - radius); currentX <= Math.min(x + radius, imageWidth); currentX++){
                        if ((currentX - x) ** 2 + (currentY - y) ** 2 < radSquared) {
                            _this.setPixelColor(indexByCoordinates(currentX, currentY, imageWidth), color);
                        }
                    }
                }
                break;
            }
        case DrawCircleType.DRAW_CIRCLE_MEM:
            {
                const color = _this.getRegister("COL");
                const x = _this.getRegister("x");
                const y = _this.getRegister("y");
                const radius = _this.getMemoryAt(params[2]);
                const radSquared = radius ** 2;
                for(let currentY = Math.max(1, y - radius); currentY <= Math.min(y + radius, imageHeight); currentY++){
                    for(let currentX = Math.max(1, x - radius); currentX <= Math.min(x + radius, imageWidth); currentX++){
                        if ((currentX - x) ** 2 + (currentY - y) ** 2 < radSquared) {
                            _this.setPixelColor(indexByCoordinates(currentX, currentY, imageWidth), color);
                        }
                    }
                }
                break;
            }
    }
}
var RenderInstructionSet;
(function(RenderInstructionSet) {
    RenderInstructionSet[RenderInstructionSet["MODIFY_PIXEL"] = 0] = "MODIFY_PIXEL";
    RenderInstructionSet[RenderInstructionSet["FILL"] = 1] = "FILL";
})(RenderInstructionSet || (RenderInstructionSet = {
}));
class IDGVM extends InstructionParser {
    imageCopy;
    image;
    imageModificationStack = new Array();
    imageRenderCB;
    IPStack = [];
    constructor(memory2, loadedFile1, interruptVectorAddress2 = 150000){
        super(memory2, loadedFile1, interruptVectorAddress2);
        this.image = {
            imageData: loadedFile1.image,
            width: loadedFile1.imageWidth,
            height: loadedFile1.imageHeight
        };
        this.imageCopy = this.image.imageData.slice();
        this.imageRenderCB = ()=>{
        };
    }
    debug() {
        for(const name in this.registerMap){
            try {
                console.log(`${name}: ${this.getRegister(name).toString().padStart(3, "0")}`);
            } catch (e) {
                console.error("Potential empty stack (did you forget to add instructions?)", e);
            }
        }
        console.log();
    }
    onImageRenderRequest(cb) {
        this.imageRenderCB = cb;
    }
    render() {
        this.image.imageData = this.imageCopy.slice();
        const t = this.imageModificationStack.splice(0);
        this.imageRenderCB(t);
    }
    viewMemoryAt(address, n = 8) {
        const nextNBytes = Array.from({
            length: n
        }, (_, i)=>this.memory.getUint8(address + i)
        ).map((v)=>v
        );
        console.log(`[${address}]: ${nextNBytes.join(" ")}`);
    }
    handleInterupt(value) {
        const interruptBit = value % 15;
        console.log(`CPU Interrupt :: ${interruptBit}`);
        const isUnmasked = Boolean(1 << interruptBit & this.getRegister("im"));
        if (!isUnmasked) {
            return;
        }
        const addressPointer = this.interruptVectorAddress + interruptBit * 4;
        const address = this.memory.getUint32(addressPointer);
        if (!this.isInInterruptHandler) {
            this.push(0);
            this.pushState();
        }
        this.isInInterruptHandler = true;
        this.setRegister("ip", address);
    }
    getPixelColor(n) {
        return this.image.imageData[n];
    }
    setPixelColor(n, value) {
        if (n >= 0 && n < this.imageCopy.length && this.image.imageData[n] !== value) {
            this.imageCopy[n] = value;
            this.imageModificationStack.push([
                RenderInstructionSet.MODIFY_PIXEL,
                n,
                value
            ]);
        }
    }
    pushIp() {
        this.IPStack.push(this.getRegister("ip"));
    }
    execute(instruction) {
        return [
            ()=>{
                this.emptyInstructionAtStep++;
            },
            ()=>executeMove(this, instruction)
            ,
            ()=>executeSignedMove(this, instruction)
            ,
            ()=>addition(this, instruction)
            ,
            ()=>subtraction(this, instruction)
            ,
            ()=>{
                const r1 = instruction[1];
                const r1v = this.registers.getUint32(r1);
                this.registers.setUint32(r1, r1v + 1);
            },
            ()=>{
                const r1 = instruction[1];
                const oldValue = this.registers.getUint32(r1);
                this.registers.setUint32(r1, oldValue - 1);
            },
            ()=>multiplication(this, instruction)
            ,
            ()=>bitwiseShift(this, instruction)
            ,
            ()=>bitwiseAND(this, instruction)
            ,
            ()=>bitwiseOR(this, instruction)
            ,
            ()=>{
                const r1 = instruction[1];
                const registerValue = this.registers.getUint32(r1);
                this.setRegister("acc", ~registerValue & 2147483647);
            },
            ()=>jumpBasedOnAcc(this, instruction)
            ,
            ()=>this.setRegister("ip", instruction[1])
            ,
            ()=>this.push(instruction[1])
            ,
            ()=>this.push(this.registers.getUint32(instruction[1]))
            ,
            ()=>{
                console.warn("PSH_STATE is deprecated");
                this.pushState();
            },
            ()=>{
                const value = this.IPStack.pop();
                if (!value) throw new Error("Pop called on an empty stack");
                this.registers.setUint32(instruction[1], value);
            },
            ()=>callALocation(this, instruction)
            ,
            ()=>{
                const value = this.IPStack.pop();
                if (!value) throw new Error("Pop called on an empty stack");
                this.setRegister("ip", value);
            },
            ()=>{
                const lastIP = this.IPStack.pop();
                if (!lastIP) throw new Error("Nowhere to return to");
                this.setRegister("ip", lastIP + 1);
            },
            ()=>{
                this.halt = true;
                return true;
            },
            ()=>{
                this.isInInterruptHandler = false;
                this.popState();
            },
            ()=>{
                const interuptValue = instruction[1] & 15;
                this.handleInterupt(interuptValue);
            },
            ()=>{
                this.IPStack.push(this.getRegister("ip"));
            },
            ()=>{
                this.IPStack.push(this.getRegister("ip") + instruction[1]);
            },
            ()=>randomToAccumulator(this, instruction)
            ,
            ()=>this.setRegister("ip", this.getRegister("ip") + instruction[1])
            ,
            ()=>{
                const time = instruction[1];
                const addressToCall = instruction[2];
                const intervalHandler = setInterval(()=>{
                    if (!this.halt) {
                        this.pushState();
                        this.setRegister("ip", addressToCall);
                    }
                }, time);
                this.setRegister("r9", intervalHandler);
            },
            ()=>{
                const x = this.getRegister("x");
                const y = this.getRegister("y");
                const color = this.getRegister("COL");
                const index = indexByCoordinates(x, y, this.image.width);
                this.setPixelColor(index, color);
            },
            ()=>modifyPixel(this, instruction)
            ,
            ()=>this.render()
            ,
            async ()=>await sleep(instruction[1])
            ,
            ()=>fetchImageInfo(this, instruction)
            ,
            ()=>fetchNeighboringPixel(this, instruction)
            ,
            ()=>fetchNeighboringPixel(this, instruction)
            ,
            ()=>{
                const x = this.getRegister("x");
                const y = this.getRegister("y");
                const reg = instruction[1];
                this.registers.setUint32(reg, indexByCoordinates(x, y, this.image.width));
            },
            ()=>fetchPixelIndex(this, instruction)
            ,
            ()=>{
                const r = this.getRegister("R");
                const g = this.getRegister("G");
                const b = this.getRegister("B");
                this.setRegister("COL", combineRGB([
                    r,
                    g,
                    b
                ]));
            },
            ()=>RGBConversion(this, instruction)
            ,
            ()=>{
                const color = this.getRegister("COL");
                const [r, g, b] = spreadRGB(color);
                this.setRegister("R", r);
                this.setRegister("G", g);
                this.setRegister("B", b);
            },
            ()=>drawBox(this, instruction)
            ,
            ()=>drawBoxManual(this, instruction)
            ,
            ()=>drawCircleA(this, instruction)
            ,
            ()=>drawLineP(this, instruction)
            ,
            ()=>modifyLuminosityIns(this, instruction)
            ,
            ()=>{
                let currentX = this.getRegister("x");
                let currentY = this.getRegister("y");
                let direction = this.getRegister("r9");
                const color1 = instruction[1];
                const color2 = instruction[2];
                const thisIndex = indexByCoordinates(currentX, currentY, this.image.width);
                const moveForward = (d)=>{
                    switch(d){
                        case 1:
                            currentX++;
                            break;
                        case 2:
                            currentY++;
                            break;
                        case 3:
                            currentX--;
                            break;
                        case 4:
                            currentY--;
                            break;
                    }
                };
                const saveBack = (dir, x, y)=>{
                    this.setRegister("r9", dir);
                    this.setRegister("x", x);
                    this.setRegister("y", y);
                };
                if (color1 === this.image.imageData[thisIndex]) {
                    direction++;
                    if (direction > 4) direction = 1;
                    this.setPixelColor(thisIndex, color2);
                    moveForward(direction);
                    saveBack(direction, currentX, currentY);
                } else if (color2 === this.image.imageData[indexByCoordinates(currentX, currentY, this.image.width)]) {
                    direction--;
                    if (direction < 1) direction = 4;
                    this.setPixelColor(thisIndex, color1);
                    moveForward(direction);
                    saveBack(direction, currentX, currentY);
                }
            },
            ()=>{
                const onColor = instruction[1];
                const offColor = instruction[2];
                for(let i = 0; i < this.image.imageData.length; i++){
                    seeds(this, i, onColor, offColor);
                }
            },
            ()=>{
                console.log(`####### DEBUG ${instruction[1]} ##################`);
                this.debug();
                console.log(`####### END DEBUG ${instruction[1]}  ##############`);
            }
        ][instruction[0]]();
    }
    run() {
        for (const inst of this.fetch()){
            const htl = this.execute(inst);
            if (htl || this.halt) return;
        }
    }
}
class IDGLoader {
    vm;
    memoryMapper;
    constructor(rawFileData, autoStart = false){
        const loaded = IDGLoader.fileLoader(rawFileData);
        this.memoryMapper = new MemoryMapper();
        const memory3 = createMemory(loaded.memoryRequest);
        this.memoryMapper.map(memory3, 0, memory3.byteLength);
        const writableBytes = new Uint8Array(memory3.buffer);
        writableBytes.set(loaded.memorySection);
        this.vm = new IDGVM(this.memoryMapper, loaded);
        this.vm.viewMemoryAt(0, 30);
        if (autoStart) this.startVM();
    }
    onImageUpdate(cb) {
        this.vm.onImageRenderRequest((x)=>{
            cb(x);
        });
    }
    static fileLoader(rawFileData) {
        const decompressed = deCompress(rawFileData);
        const x = new DataView(decompressed.buffer);
        const imageWidth = x.getUint32(0);
        const imageHeight = x.getUint32(4);
        const memorySizeRequest = x.getUint32(8);
        const stackSizeRequirement = x.getUint32(12);
        console.log(`Attempting to load file. header info w(${imageWidth}), h(${imageHeight}), mem(${memorySizeRequest}), stack(${stackSizeRequirement})`);
        const image = [];
        let i = 16;
        for(; i < imageWidth * imageHeight * 4 + 13; i += 4){
            image.push(x.getUint32(i));
        }
        const memorySection = decompressed.slice(i, i + memorySizeRequest);
        return {
            imageWidth,
            imageHeight,
            memoryRequest: memorySizeRequest,
            image,
            memorySection,
            stackSizeRequirement
        };
    }
    startVM() {
        this.vm.halt = false;
        return this.vm.run();
    }
    stopVM() {
        return this.vm.execute([
            Instructions.HLT
        ]);
    }
    getVM() {
        return this.vm;
    }
}
export { IDGLoader as default };
