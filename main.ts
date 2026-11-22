// Tiny stack VM (ISA v1): runs a set's 40 programs, writes each answer.
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const ID=process.env.MAKEFUN_INPUT_DIR||'/input',OD=process.env.MAKEFUN_OUTPUT_DIR||'/output';
function run(P,I){
 const S=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),O=new Uint8Array(65536);
 let sp=0,cp=0,ol=0,ip=0,pc=0,n=0,t;
 const need=(p,q)=>sp<p?2:sp-p+q>256?3:0;
 const s16=v=>(v<<16)>>16;
 for(;;){
  if(n>=1e6)return[10,O,ol];
  if(pc<0||pc>=P.length)return[9,O,ol];
  const o=P[pc];let il;
  if(o===1)il=1;else if(o===2)il=4;else if(o>=0x30&&o<=0x33)il=2;
  else if(o===0||(o>=3&&o<=7)||(o>=0x10&&o<=0x1e)||(o>=0x20&&o<=0x22)||o===0x34||(o>=0x40&&o<=0x41)||(o>=0x50&&o<=0x53))il=0;
  else return[5,O,ol];
  if(pc+1+il>P.length)return[9,O,ol];
  const nx=pc+1+il;
  switch(o){
   case 0:return[0,O,ol];
   case 1:if(t=need(0,1))return[t,O,ol];S[sp++]=(P[pc+1]<<24)>>24;pc=nx;break;
   case 2:if(t=need(0,1))return[t,O,ol];S[sp++]=P[pc+1]|P[pc+2]<<8|P[pc+3]<<16|P[pc+4]<<24;pc=nx;break;
   case 3:if(t=need(1,0))return[t,O,ol];sp--;pc=nx;break;
   case 4:if(t=need(1,2))return[t,O,ol];S[sp]=S[sp-1];sp++;pc=nx;break;
   case 5:if(t=need(2,2))return[t,O,ol];{const a=S[sp-1];S[sp-1]=S[sp-2];S[sp-2]=a;pc=nx;break;}
   case 6:if(t=need(2,3))return[t,O,ol];S[sp]=S[sp-2];sp++;pc=nx;break;
   case 7:if(t=need(3,3))return[t,O,ol];{const a=S[sp-3];S[sp-3]=S[sp-2];S[sp-2]=S[sp-1];S[sp-1]=a;pc=nx;break;}
   case 0x10:case 0x11:case 0x12:case 0x13:case 0x14:case 0x15:case 0x16:case 0x18:case 0x19:case 0x1a:case 0x1c:case 0x1d:case 0x1e:case 0x20:case 0x21:case 0x22:
    if(t=need(2,1))return[t,O,ol];
    {const b=S[--sp],a=S[sp-1];let r;
    if(o===0x10)r=a+b|0;else if(o===0x11)r=a-b|0;else if(o===0x12)r=Math.imul(a,b);
    else if(o===0x13){if(!b)return[4,O,ol];r=Math.trunc(a/b)|0;}
    else if(o===0x14){if(!b)return[4,O,ol];r=a%b|0;}
    else if(o===0x15){if(!b)return[4,O,ol];r=Math.trunc((a>>>0)/(b>>>0))|0;}
    else if(o===0x16){if(!b)return[4,O,ol];r=(a>>>0)%(b>>>0)|0;}
    else if(o===0x18)r=a&b;else if(o===0x19)r=a|b;else if(o===0x1a)r=a^b;
    else if(o===0x1c)r=a<<(b&31);else if(o===0x1d)r=a>>(b&31);else if(o===0x1e)r=a>>>(b&31)|0;
    else if(o===0x20)r=a===b?1:0;else if(o===0x21)r=a<b?1:0;else r=(a>>>0)<(b>>>0)?1:0;
    S[sp-1]=r;pc=nx;break;}
   case 0x17:if(t=need(1,1))return[t,O,ol];S[sp-1]=-S[sp-1]|0;pc=nx;break;
   case 0x1b:if(t=need(1,1))return[t,O,ol];S[sp-1]=~S[sp-1];pc=nx;break;
   case 0x30:pc=nx+s16(P[pc+1]|P[pc+2]<<8);break;
   case 0x31:if(t=need(1,0))return[t,O,ol];pc=S[--sp]===0?nx+s16(P[pc+1]|P[pc+2]<<8):nx;break;
   case 0x32:if(t=need(1,0))return[t,O,ol];pc=S[--sp]!==0?nx+s16(P[pc+1]|P[pc+2]<<8):nx;break;
   case 0x33:if(cp>=64)return[7,O,ol];C[cp++]=nx;pc=P[pc+1]|P[pc+2]<<8;break;
   case 0x34:if(!cp)return[8,O,ol];pc=C[--cp];break;
   case 0x40:if(t=need(1,1))return[t,O,ol];{const a=S[sp-1];if(a<0||a>255)return[6,O,ol];S[sp-1]=M[a];pc=nx;break;}
   case 0x41:if(t=need(2,0))return[t,O,ol];{const a=S[--sp],v=S[--sp];if(a<0||a>255)return[6,O,ol];M[a]=v;pc=nx;break;}
   case 0x50:if(t=need(1,0))return[t,O,ol];{const v=S[--sp],s=String(v);if(ol+s.length>65536)return[11,O,ol];for(let i=0;i<s.length;i++)O[ol++]=s.charCodeAt(i);pc=nx;break;}
   case 0x51:if(t=need(1,0))return[t,O,ol];{const v=S[--sp];if(ol>=65536)return[11,O,ol];O[ol++]=v&255;pc=nx;break;}
   case 0x52:if(t=need(0,1))return[t,O,ol];S[sp++]=ip<I.length?I[ip++]:-1;pc=nx;break;
   case 0x53:if(t=need(1,0))return[t,O,ol];return[S[--sp]&255,O,ol];
   default:return[5,O,ol];
  }
  n++;
 }
}
let ids;try{ids=readdirSync(ID,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name).sort()}catch(e){ids=[];for(let i=1;i<=40;i++)ids.push('i'+String(i).padStart(3,'0'))}
for(const d of ids){
 const rd=f=>{try{return readFileSync(join(ID,d,f))}catch(e){return Buffer.alloc(0)}};
 const[c,O,ol]=run(rd('program.bin'),rd('input.bin'));
 const od=join(OD,d);mkdirSync(od,{recursive:true});
 writeFileSync(join(od,'stdout.bin'),O.subarray(0,ol));
 writeFileSync(join(od,'exit.txt'),String(c)+'\n');
}
