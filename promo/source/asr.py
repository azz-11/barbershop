import sys, sherpa_onnx, soundfile as sf, numpy as np
d='models/sherpa-onnx-whisper-small/'
r=sherpa_onnx.OfflineRecognizer.from_whisper(encoder=d+'small-encoder.int8.onnx',decoder=d+'small-decoder.int8.onnx',tokens=d+'small-tokens.txt',language='ar',task='transcribe',num_threads=4)
for f in sys.argv[1:]:
    a,sr=sf.read(f,dtype='float32')
    if a.ndim>1: a=a.mean(1)
    s=r.create_stream(); s.accept_waveform(sr,a); r.decode_stream(s); print(f, '=>', s.result.text)
