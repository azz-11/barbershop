import json, numpy as np, soundfile as sf
exec(open('audio.py').read().split('# ---------- SFX ----------')[0].split("d=json.load")[0])
SR=48000; rng=np.random.default_rng(11)
d=json.load(open('sfx.json')); tl=d['tl']; T=tl['total']+0.3; N=int(T*SR)
BPM=tl['bpm']; beat=60/BPM; bar=4*beat
S=tl['scenes']; d0=S[1]['start']; cta=S[-1]['start']; end=S[-1]['end']
def t(n): return np.arange(n)/SR
def lp(x,c):
    y=np.empty_like(x); s=0.0; c=np.broadcast_to(c,x.shape)
    for i in range(len(x)): s+=c[i]*(x[i]-s); y[i]=s
    return y
def fft_lp(x,fc,order=2):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); return np.fft.irfft(X/(1+(f/fc)**(2*order)),len(x))
def fft_hp(x,fc,order=2):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR)+1e-9; return np.fft.irfft(X/(1+(fc/f)**(2*order)),len(x))
def conv(x,h):
    n=len(x)+len(h)-1; m=1<<(n-1).bit_length(); return np.fft.irfft(np.fft.rfft(x,m)*np.fft.rfft(h,m),m)[:len(x)]
def ir(sec,seed):
    r=np.random.default_rng(seed); n=int(sec*SR); h=r.standard_normal(n)*np.exp(-t(n)*6.5/sec); h=fft_lp(h,7000); h[:int(.012*SR)]=0; return h/np.sqrt(np.sum(h**2))
IRL,IRR=ir(2.4,1),ir(2.4,2)
def env(n,a,r):
    x=np.ones(n); na=max(1,int(a*SR)); x[:na]=np.linspace(0,1,na); x[na:]*=np.exp(-np.arange(n-na)/(r*SR)); return x
def bq_lp(x,fc):
    a=1-np.exp(-2*np.pi*fc/SR); return lp(lp(x,a),a)
def note(m): return 440*2**((m-69)/12)
L=np.zeros(N); R=np.zeros(N); sendL=np.zeros(N); sendR=np.zeros(N)
def place(buf,y,i,g=1.0):
    if i>=N or i+len(y)<=0: return
    a=max(0,-i); m=min(len(y),N-i); buf[i+a:i+m]+=g*y[a:m]
def put(y,tt,g=1.0,pan=0.0,send=0.0):
    i=int(round(tt*SR)); gl=g*np.cos((pan+1)*np.pi/4)*1.414; gr=g*np.sin((pan+1)*np.pi/4)*1.414
    place(L,y,i,gl); place(R,y,i,gr)
    if send: place(sendL,y,i,gl*send); place(sendR,y,i,gr*send)
# ---------- arrangement ----------
prog=[(57,[57,60,64,71]),(53,[53,57,60,64]),(48,[48,52,55,59]),(55,[55,59,62,66])]  # Am9 Fmaj7 Cmaj7 G
def chord_at(tt): k=int(np.floor((tt-d0)/bar))%4; return prog[k]
drums_on=lambda tt: d0<=tt<cta-2*bar or cta<=tt<cta+3*bar
build=lambda tt: cta-2*bar<=tt<cta
# instruments
def kick():
    n=int(.42*SR); x=t(n); y=np.sin(2*np.pi*np.cumsum(46+150*np.exp(-x*38))/SR)*np.exp(-x*7.5)
    y[:240]+=np.linspace(.6,0,240)*rng.standard_normal(240)*.5; return np.tanh(1.8*y)*.9
def clap():
    n=int(.35*SR); x=rng.standard_normal(n); x=fft_hp(fft_lp(x,4500),900); e=np.exp(-t(n)*14)
    for o in (0,.011,.022): e[:int((o+.008)*SR)]*=1
    return x*e*0.6
def hat(open_=False):
    n=int((.28 if open_ else .05)*SR); x=fft_hp(rng.standard_normal(n),7500); return x*np.exp(-t(n)*(9 if open_ else 70))*.35
def shaker():
    n=int(.09*SR); x=fft_hp(rng.standard_normal(n),5000); e=np.sin(np.pi*np.linspace(0,1,n))**2; return x*e*.18
def bass(m,dur):
    n=int(dur*SR); x=t(n); f=note(m-24); y=np.sin(2*np.pi*f*x)+.35*np.sin(4*np.pi*f*x)+.15*np.sin(6*np.pi*f*x)
    e=np.minimum(1,x/.005)*np.exp(-x*2.2); e[-200:]*=np.linspace(1,0,200); return np.tanh(1.4*y*e)*.55
def pluck(m):
    n=int(.6*SR); x=t(n); f=note(m); y=sum((1/k)*np.sin(2*np.pi*f*k*x)*np.exp(-x*(5+k*3)) for k in range(1,6)); return y*np.minimum(1,x/.003)*.22
def pad(ch,dur):
    n=int(dur*SR); x=t(n); y=np.zeros(n); yr=np.zeros(n)
    for m in ch:
        for det,side in ((-0.12,0),(0.12,1)):
            f=note(m)*2**(det/12); w=np.sin(2*np.pi*f*x+0.8*np.sin(2*np.pi*f*x))  # fm-ish warmth
            (y if side==0 else yr)[:]+=w
    e=np.minimum(1,x/0.8)*np.minimum(1,(dur-x)/0.6); return fft_lp(y*e,2200)*.035, fft_lp(yr*e,2200)*.035
def bell(m):
    n=int(1.6*SR); x=t(n); f=note(m); y=np.sin(2*np.pi*f*x+2.0*np.exp(-x*3)*np.sin(2*np.pi*f*3.5*x))*np.exp(-x*2.5); return y*.18
K,C,H,HO,SH=kick(),clap(),hat(),hat(True),shaker()
kicks=[]
# pads across whole piece (intro: held Am)
pl,pr=pad(prog[0][1],d0+0.4); place(L,pl,0); place(R,pr,0); place(sendL,pl*.8,0); place(sendR,pr*.8,0)
b=0
while d0+b*bar<end-0.5:
    tb=d0+b*bar; root,ch=chord_at(tb+.01)
    last = tb>=cta+3*bar
    dur=bar+0.5 if not last else min(end-tb, bar*3)
    pl,pr=pad(ch,dur); i=int(tb*SR); place(L,pl,i); place(R,pr,i); place(sendL,pl*.8,i); place(sendR,pr*.8,i)
    for s16 in range(16):
        ts=tb+s16*beat/4
        if ts>=end-0.3: break
        on=drums_on(ts)
        if on:
            if s16 in (0,4,8,12) or s16==10 and b%2: put(K,ts,1.0); kicks.append(ts)
            if s16 in (4,12): put(C,ts,.75,0,.35)
            if s16%2==1: put(H,ts,.55+.25*(s16%4==3),0.25)
            if s16 in (6,14) and b%2==1: put(HO,ts,.5,-.2)
            if S[7]['start']<=ts: put(SH,ts,.9,-.4)
            # bass: root 8ths with octave pops
            if s16%2==0:
                m=root+(12 if s16 in (6,14) else 0); put(bass(m,beat/2*0.95),ts,1.0)
        # plucks: arpeggio 16ths pattern (throughout except intro)
        if (on or tb>=cta+3*bar) and s16%2==0:
            arp=[ch[0]+12,ch[2]+12,ch[1]+24,ch[3]+12,ch[2]+24,ch[1]+12,ch[3]+24,ch[2]+12]
            pn=pluck(arp[(s16//2)%8]); pan=[-.45,.45][(s16//2)%2]
            put(pn,ts,.9,pan,.6); put(pn*.35,ts+beat*.75,1,-pan,.4)  # dotted-8th echo
    b+=1
# build-up: snare roll + noise riser + filter, then impact at cta
rb=cta-2*bar; n=int(2*bar*SR); x=t(n); k=x/x[-1]
nz=rng.standard_normal(n); riser=lp(nz,0.004+0.35*k**2.5)*k**2*0.8
put(riser,rb,1,0,.5)
steps=[(0,1/2),(bar,1/4),(1.5*bar,1/8)]
tt=rb
while tt<cta-0.01:
    div=1/2 if tt<rb+bar else (1/4 if tt<rb+1.5*bar else 1/8)
    g=0.25+0.6*((tt-rb)/(2*bar))
    put(C*.8,tt,g,0,.3); tt+=beat*div
# bells at CTA
for j,m in enumerate([76,79,81,84,83,79]):
    put(bell(m),cta+j*beat,1,[-.3,.3][j%2],.7)
# outro bell
put(bell(81),end-3.4,1.1,0,.9); put(bell(76),end-3.4+beat*1.5,0.8,0,.9)
# sidechain
sc=np.ones(N); x=t(int(.35*SR)); dip=1-0.55*np.exp(-x/0.09)
for kt in kicks:
    i=int(kt*SR); m=min(len(dip),N-i); sc[i:i+m]=np.minimum(sc[i:i+m],dip[:m])
# reverb
wetL=conv(sendL,IRL); wetR=conv(sendR,IRR)
mL=(L+0.35*wetL); mR=(R+0.35*wetR)
# re-add kick un-ducked: kick was in L/R already; duck only non-kick by approximating (apply sc then add kick)
kickbus=np.zeros(N)
for kt in kicks: place(kickbus,K,int(kt*SR))
mL=(mL-kickbus)*sc+kickbus; mR=(mR-kickbus)*sc+kickbus
# fade
fo=int(2.5*SR); mL[-fo:]*=np.linspace(1,0,fo)**1.5; mR[-fo:]*=np.linspace(1,0,fo)**1.5
mus=np.stack([mL,mR],1); mus/=np.max(abs(mus))
sf.write('music2.wav',mus*0.6,SR)
# ---------- SFX (stereo) ----------
exec(open('audio.py').read().split('# ---------- SFX ----------')[1].split('cache={}')[0])
def hit():
    n=int(.9*SR); x=t(n); y=np.sin(2*np.pi*np.cumsum(38+90*np.exp(-x*25))/SR)*np.exp(-x*5); nz=fft_lp(rng.standard_normal(n),1800)*np.exp(-x*14)*.6
    return np.tanh(1.5*(y+nz))*.55
LIB['hit']=hit
sL=np.zeros(N); sR=np.zeros(N); sw=np.zeros(N)
cache={}
for e in d['sfx']:
    nm=e['s']
    if nm not in cache: cache[nm]=LIB[nm]()
    y=cache[nm]; i=int(e['t']*SR)
    if nm in ('whoosh','whoosh2','whip','swish'):
        pn=np.linspace(-0.8,0.8,len(y)); gl=np.cos((pn+1)*np.pi/4); gr=np.sin((pn+1)*np.pi/4)
        place(sL,y*gl*1.3,i); place(sR,y*gr*1.3,i)
    else:
        place(sL,y,i); place(sR,y,i)
    place(sw,y*.5,i)
wet=conv(sw,IRL)*.18
sfx=np.stack([sL+wet,sR+conv(sw,IRR)*.18],1); sfx/=np.max(abs(sfx))
sf.write('sfx2.wav',sfx*0.6,SR)
print('ok',T,len(kicks))
