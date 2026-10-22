/* Padded 45-degree panels contain the gauges, with independent small corners. */
(function(root){
  function trapezoidShades({width,height,left,right}){
    const panel=circle=>({top:Math.max(10,circle.r*.25),diagonal:Math.max(9,circle.r*.22),corner:Math.max(14,circle.r*.45)});
    const lp=panel(left),rp=panel(right);
    const leftTop=left.cy-left.r-lp.top,rightTop=right.cy-right.r-rp.top;
    const leftIntercept=left.cy-left.cx-(left.r+lp.diagonal)*Math.SQRT2;
    const rightIntercept=right.cy+right.cx-(right.r+rp.diagonal)*Math.SQRT2;
    const leftCorner=leftTop-leftIntercept,rightCorner=rightIntercept-rightTop;
    const leftBottom=height-leftIntercept,rightBottom=rightIntercept-height;
    const lt=lp.corner*Math.tan(Math.PI/8),rt=rp.corner*Math.tan(Math.PI/8);
    const le=[leftCorner+lt/Math.SQRT2,leftTop+lt/Math.SQRT2];
    const re=[rightCorner-rt/Math.SQRT2,rightTop+rt/Math.SQRT2];
    return {
      left:[[0,leftTop],[leftCorner,leftTop],[leftBottom,height],[0,height]],
      right:[[rightCorner,rightTop],[width,rightTop],[width,height],[rightBottom,height]],
      padding:{left:lp,right:rp},
      paths:{
        left:`M0,${leftTop}H${leftCorner-lt}A${lp.corner},${lp.corner} 0 0 1 ${le.join(',')}L${leftBottom},${height}H0Z`,
        right:`M${rightCorner+rt},${rightTop}H${width}V${height}H${rightBottom}L${re.join(',')}A${rp.corner},${rp.corner} 0 0 1 ${rightCorner+rt},${rightTop}Z`,
      },
    };
  }
  // Rasterize one continuous hairline at device resolution. No joined SVG segments or stepped gradient stops.
  function taskLinePixels({width,pixelRatio=1}){
    const scale=Math.max(.5,pixelRatio),w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(8*scale));
    const center=Math.floor(h/2)+.5,pixels=new Uint8ClampedArray(w*h*4);
    for(let x=0;x<w;x++){
      const t=(x+.5)/w,sine=Math.sin(Math.PI*t);
      const blend=Math.max(0,Math.min(1,(t-.46)/.08)),smooth=blend*blend*(3-2*blend);
      const opacity=(.96-.67*smooth)*Math.pow(sine,.55),sigma=(.12+.4*sine)*scale;
      for(let y=0;y<h;y++){
        let coverage=0;
        for(let sample=0;sample<8;sample++){const d=(y+(sample+.5)/8-center)/sigma;coverage+=Math.exp(-.5*d*d)/8;}
        const i=(y*w+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=255;pixels[i+3]=Math.round(255*opacity*coverage);
      }
    }
    return {width:w,height:h,center,pixels};
  }
  const api={trapezoidShades,taskLinePixels};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.DshHudGeometry=api;
})(typeof window==='object'?window:globalThis);
