#!/usr/bin/env python3
"""Reescribe un ZIP/APK alineando a 4 bytes los datos de las entradas sin comprimir (como zipalign -p 4)."""
import struct, sys, zipfile

def align(src, dst):
    zin = zipfile.ZipFile(src)
    out = open(dst, 'wb')
    central = []
    for info in zin.infolist():
        data = zin.open(info).read() if info.compress_type == 0 else None
        raw = None
        if info.compress_type != 0:
            # copia los datos comprimidos tal cual
            with open(src, 'rb') as f:
                f.seek(info.header_offset)
                h = f.read(30)
                nlen, xlen = struct.unpack('<HH', h[26:30])
                f.seek(info.header_offset + 30 + nlen + xlen)
                raw = f.read(info.compress_size)
        name = info.filename.encode('utf-8')
        offset = out.tell()
        extra = b''
        if info.compress_type == 0:
            pad = (4 - (offset + 30 + len(name)) % 4) % 4
            extra = b'\0' * pad
        crc = info.CRC
        size = info.file_size
        csize = info.compress_size
        flags = info.flag_bits & ~0x08
        dt = info.date_time
        dostime = (dt[3] << 11) | (dt[4] << 5) | (dt[5] // 2)
        dosdate = ((dt[0] - 1980) << 9) | (dt[1] << 5) | dt[2]
        out.write(struct.pack('<IHHHHHIIIHH', 0x04034b50, 20, flags, info.compress_type, dostime, dosdate, crc, csize, size, len(name), len(extra)))
        out.write(name + extra)
        out.write(data if data is not None else raw)
        central.append((info, name, offset, flags, dostime, dosdate))
    cd_start = out.tell()
    for info, name, offset, flags, dostime, dosdate in central:
        out.write(struct.pack('<IHHHHHHIIIHHHHHII', 0x02014b50, 20, 20, flags, info.compress_type, dostime, dosdate,
                              info.CRC, info.compress_size, info.file_size, len(name), 0, 0, 0, 0, 0, offset))
        out.write(name)
    cd_end = out.tell()
    out.write(struct.pack('<IHHHHIIH', 0x06054b50, 0, 0, len(central), len(central), cd_end - cd_start, cd_start, 0))
    out.close()

if __name__ == '__main__':
    align(sys.argv[1], sys.argv[2])
