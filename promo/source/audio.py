import json, numpy as np, soundfile as sf
SR=48000; rng=np.random.default_rng(7)
d=json.load(open('sfx.json')); tl=d['tl']; T=tl['total']+0.5; N=int(T*SR)
def t(n): return np.arange(n)/SR
def env(n,a,r):  # attack/decay exp
    x=np.ones(n); na=max(1,int(a*SR)); x[:na]=np.linspace(0,1,na); x[na:]*=np.exp(-np.arange(n-na)/(r*SR)); return x
def lp(x,c):  # one-pole lowpass, c can be array
    y=np.zeros_like(x); s=0.0; c=np.broadcast_to(c,x.shape)
    for i in range(len(x)): s+=c[i]*(x[i]-s); y[i]=s
    return y
def bq_lp(x,fc):  # quick 2x one-pole
    a=1-np.exp(-2*np.pi*fc/SR); return lp(lp(x,a),a)
# ---------- SFX ----------
def whoosh(L=0.7,up=True):
    n=int(L*SR); x=rng.standard_normal(n); k=np.linspace(0,1,n)
    c=0.02+0.25*(np.sin(np.pi*k)**2); y=lp(x,c)-lp(x,c*0.15)
    e=np.sin(np.pi*k)**1.5; return 0.9*y*e/np.max(np.abs(y*e)+1e-9)
def pop():
    n=int(.12*SR); tt=t(n); f=500+700*np.exp(-tt*40); ph=2*np.pi*np.cumsum(f)/SR
    return 0.6*np.sin(ph)*env(n,.002,.035)
def tick():
    n=int(.05*SR); x=rng.standard_normal(n); x=x-bq_lp(x,3000); return 0.5*x*env(n,.001,.008)+0.3*np.sin(2*np.pi*1800*t(n))*env(n,.001,.01)
def ding():
    n=int(1.2*SR); tt=t(n); y=sum(a*np.sin(2*np.pi*f*tt)*np.exp(-tt*dcy) for f,a,dcy in [(1318.5,.5,3.5),(1975.5,.3,4.5),(2637,.15,6),(659.3,.2,3)])
    y2=np.zeros(n); off=int(.09*SR); y2[off:]=y[:n-off]*0.0
    tt2=t(n-int(.11*SR)); y3=np.zeros(n); y3[int(.11*SR):]=sum(a*np.sin(2*np.pi*f*tt2)*np.exp(-tt2*dcy) for f,a,dcy in [(1760,.45,3.5),(2637,.2,5)])
    return 0.45*(y+y3)*env(n,.003,10)
def impact():
    n=int(1.4*SR); tt=t(n); f=110*np.exp(-tt*3)+42; y=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*2.8)
    nz=bq_lp(rng.standard_normal(n),900)*np.exp(-tt*9)*2.5
    return 0.9*np.tanh(1.6*(y+nz))
def riser():
    n=int(2.0*SR); tt=t(n); k=tt/tt[-1]; x=rng.standard_normal(n); y=lp(x,0.01+0.3*k**2)
    s=np.sin(2*np.pi*np.cumsum(200+900*k**2)/SR)*0.15
    return 0.5*(y/np.max(abs(y))+s)*k**2
def swish():
    n=int(.28*SR); x=rng.standard_normal(n); k=np.linspace(0,1,n); y=lp(x,0.05+0.4*k)-lp(x,0.02); return 0.5*y*np.sin(np.pi*k)/np.max(abs(y)+1e-9)
def bubble():
    n=int(.14*SR); tt=t(n); f=400+1200*tt/tt[-1]; return 0.45*np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,.004,.05)
def notify():
    a=bubble(); n=int(.5*SR); y=np.zeros(n); tt=t(int(.35*SR))
    tone=lambda f: 0.35*np.sin(2*np.pi*f*tt)*np.exp(-tt*9)
    y[:len(tt)]+=tone(988); y[int(.12*SR):int(.12*SR)+len(tt)]+=tone(1319); return y
def ringf():
    n=int(1.1*SR); tt=t(n); y=0.25*(np.sin(2*np.pi*1200*tt)+np.sin(2*np.pi*1500*tt))*(np.sin(2*np.pi*20*tt)>0)
    g=((tt<.4)|((tt>.6)&(tt<1.0))).astype(float); return y*g*env(n,.01,2)
def key(): return 0.8*tick()+0.5*pop()[:int(.05*SR)].tolist().__len__()*0+0.4*np.pad(pop(),(0,0))[:int(.12*SR)]
def cash():
    a=ding()*0.6; b=tick(); y=np.zeros(len(a)); y[:len(b)]+=b; return a+y
def stamp():
    n=int(.25*SR); tt=t(n); y=np.sin(2*np.pi*np.cumsum(180*np.exp(-tt*20)+60)/SR)*np.exp(-tt*25); nz=bq_lp(rng.standard_normal(n),2500)*np.exp(-tt*40)
    return 0.7*np.tanh(2*(y+nz))
def alert():
    n=int(.5*SR); tt=t(n); return 0.3*np.sin(2*np.pi*620*tt)*((tt<.12)|((tt>.18)&(tt<.3)))*env(n,.002,.5)
def whip(): return 0.7*whoosh(0.32)
LIB={'whoosh':lambda:0.55*whoosh(.75),'whoosh2':lambda:0.6*whoosh(.9),'pop':pop,'tick':tick,'ding':ding,'impact':impact,'riser':riser,'swish':swish,
     'bubble':bubble,'notify':notify,'ring':ringf,'key':lambda:0.6*np.pad(tick(),(0,int(.07*SR)))+0.5*pop(),'cash':cash,'stamp':stamp,'alert':alert,'whip':whip}
cache={}
sfx=np.zeros(N)
for e in d['sfx']:
    if e['s'] not in cache: cache[e['s']]=LIB[e['s']]()
    y=cache[e['s']]; i=int(e['t']*SR)
    if i>=N: continue
    m=min(len(y),N-i); sfx[i:i+m]+=y[:m]
# ---------- MUSIC ----------
bpm=96; beat=60/bpm; tt=t(N)
music=np.zeros(N)
def note(f): return 440*2**((f-69)/12)
prog=[(57,[57,60,64]),(53,[53,57,60]),(48,[48,52,55]),(55,[55,59,62])]  # Am F C G
bar=4*beat
# pad
for bi in range(int(T/bar)+1):
    root,ch=prog[bi%4]; s=int(bi*bar*SR); n=int(bar*SR*1.05)
    if s>=N: break
    n=min(n,N-s); x=t(n); e=np.minimum(1,x/0.6)*np.minimum(1,(bar*1.05-x)/0.5)
    y=sum(np.sin(2*np.pi*note(m+12)*x+0.3*np.sin(2*np.pi*0.3*x))+0.4*np.sin(2*np.pi*note(m+24)*x*1.003) for m in ch)
    y+=0.8*np.sin(2*np.pi*note(root-12)*x)
    music[s:s+n]+=0.05*y*e
    # pluck arpeggio 8ths
    arp=[ch[0]+24,ch[1]+24,ch[2]+24,ch[1]+24]
    for k in range(8):
        ps=s+int(k*beat/2*SR); pn=int(.4*SR)
        if ps+pn>N: break
        px=t(pn); f=note(arp[k%4]); music[ps:ps+pn]+=0.05*(np.sin(2*np.pi*f*px)+0.3*np.sin(4*np.pi*f*px))*np.exp(-px*9)
# drums (start after intro)
def kick():
    n=int(.35*SR); x=t(n); return np.sin(2*np.pi*np.cumsum(50+120*np.exp(-x*30))/SR)*np.exp(-x*9)
def hat():
    n=int(.06*SR); y=rng.standard_normal(n); y=y-bq_lp(y,6000); return 0.25*y*np.exp(-t(n)*60)
def clap():
    n=int(.2*SR); y=rng.standard_normal(n); y=bq_lp(y,3000)-bq_lp(y,800); return 0.35*y*np.exp(-t(n)*18)
K,H,C=kick(),hat(),clap()
d0=tl['scenes'][1]['start']; dend=tl['scenes'][-1]['end']-3.0
b=0
while True:
    st=d0+b*beat/2
    if st>dend: break
    i=int(st*SR)
    def add(y,g):
        m=min(len(y),N-i); music[i:i+m]+=g*y[:m]
    if b%2==0: add(K,0.55 if (b//2)%2==0 else 0.35)
    if b%2==1: add(H,0.8)
    if b%8==4: add(C,0.6)
    b+=1
# fades
fi=int(1.5*SR); music[:fi]*=np.linspace(0,1,fi); fo=int(3*SR); music[-fo:]*=np.linspace(1,0,fo)
# ---------- VO ----------
vo=np.zeros(N)
for i,s in enumerate(tl['scenes']):
    y,sr=sf.read(f'vo/{i+1:02d}.t.wav'); assert sr==SR
    j=int(s['voStart']*SR); m=min(len(y),N-j); vo[j:j+m]+=y[:m]
sf.write('vo_raw.wav',vo,SR)
# ducking envelope from VO activity
act=np.abs(vo); w=int(.05*SR); act=np.convolve(act,np.ones(w)/w,'same'); on=(act>0.01).astype(float)
w2=int(.4*SR); on=np.convolve(on,np.ones(w2)/w2,'same'); duck=1-0.55*np.clip(on*1.5,0,1)
sf.write('music.wav',music/np.max(abs(music))*0.5*duck,SR)
sf.write('sfx.wav',sfx/np.max(abs(sfx))*0.5,SR)
print('ok',T)
