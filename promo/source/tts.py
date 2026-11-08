import sys, sherpa_onnx, soundfile as sf
def tts(model_dir, text, out, speed=1.0, sid=0):
    import glob
    onnx = glob.glob(model_dir+'/*.onnx')[0]
    cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
        vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=onnx, tokens=model_dir+'/tokens.txt', data_dir=model_dir+'/espeak-ng-data', noise_scale=0.6, noise_scale_w=0.7, length_scale=1.0/speed),
        num_threads=4))
    t = sherpa_onnx.OfflineTts(cfg)
    a = t.generate(text, sid=sid, speed=speed)
    sf.write(out, a.samples, a.sample_rate)
    return len(a.samples)/a.sample_rate
if __name__ == '__main__':
    print(tts(sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv)>4 else 1.0))
