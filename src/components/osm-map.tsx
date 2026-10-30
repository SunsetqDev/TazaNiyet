import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { WebView, type WebViewMessageEvent, type WebViewProps } from "react-native-webview";
import { color } from "../lib/theme";
import { AppText } from "./ui/app-text";

/**
 * Карта OpenStreetMap (тайлы OpenFreeMap, библиотека MapLibre GL JS) во встроенном WebView.
 * Без ключей и банковских карт; одинаково работает в Expo Go и в APK. Нужен интернет.
 */

export type MapPoint = { lat: number; lng: number };

/** available — свободное (зелёное), mine — моё (лаймовое), busy — занято (серое), point — метка места (форма заявки). */
export type MapMarker = MapPoint & { id: string | number; kind: "available" | "mine" | "busy" | "point" };

export type OsmMapHandle = { flyTo: (p: MapPoint, zoom?: number) => void };

type Props = {
  center: MapPoint;
  zoom?: number;
  markers?: MapMarker[];
  selectedId?: string | number | null;
  /** своя точка (синяя) — передаётся из expo-location */
  me?: MapPoint | null;
  /** метку kind="point" можно перетаскивать */
  draggable?: boolean;
  /** false — статичная мини-карта (нажатие всё равно вызывает onPress) */
  interactive?: boolean;
  /** отступы видимой области (под шапкой и карточкой поверх карты) */
  padding?: { top?: number; bottom?: number };
  onPress?: (p: MapPoint) => void;
  onMarkerPress?: (id: string) => void;
  onMarkerDrag?: (p: MapPoint) => void;
  style?: StyleProp<ViewStyle>;
};

// типы react-native-webview объявляют props как `WebViewProps & undefined` (= never в TS 6) — задаём их явно
const MapWebView = WebView as unknown as React.ComponentType<WebViewProps & { ref?: React.Ref<WebView<{}>> }>;

const PIN = {
  available: color.forest,
  mine: color.lime,
  busy: color.faint,
  point: color.forest,
};

function html(init: object) {
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css">
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>
html,body,#m{margin:0;height:100%;width:100%;background:${color.sand};touch-action:none}
.pin{width:30px;height:30px;border-radius:50%;border:3px solid #fff;box-sizing:border-box;box-shadow:0 1px 4px rgba(0,0,0,.25);transition:transform .15s}
.pin.sel{transform:scale(1.3)}
.pin.point{width:26px;height:26px}
.me{width:16px;height:16px;border-radius:50%;background:#2F80ED;border:3px solid #fff;box-shadow:0 0 0 6px rgba(47,128,237,.2)}
.maplibregl-ctrl-attrib{font:11px sans-serif}
</style></head><body><div id="m"></div><script>
var S=${JSON.stringify(init)};
var post=function(o){window.ReactNativeWebView.postMessage(JSON.stringify(o))};
if(!window.maplibregl){post({t:'error'})}else{
var map=new maplibregl.Map({container:'m',style:'https://tiles.openfreemap.org/styles/liberty',center:[S.center.lng,S.center.lat],zoom:S.zoom,interactive:S.interactive,attributionControl:false});
map.addControl(new maplibregl.AttributionControl({compact:true}));
var markers={},me=null;
var failTimer=setTimeout(function(){if(!map.loaded())post({t:'error'})},20000);
map.on('click',function(e){post({t:'press',lat:e.lngLat.lat,lng:e.lngLat.lng})});
function setPadding(p){map.setPadding({top:p.top||0,bottom:p.bottom||0,left:0,right:0})}
window.__set=function(st){
  var keep={};
  (st.markers||[]).forEach(function(mk){
    var id=String(mk.id);keep[id]=1;var m=markers[id];
    if(!m){
      var el=document.createElement('div');
      el.addEventListener('click',function(ev){ev.stopPropagation();post({t:'marker',id:id})});
      m=new maplibregl.Marker({element:el,draggable:st.draggable&&mk.kind==='point'}).setLngLat([mk.lng,mk.lat]).addTo(map);
      m.on('dragend',function(){var ll=m.getLngLat();post({t:'drag',lat:ll.lat,lng:ll.lng})});
      markers[id]=m;
    }else{m.setLngLat([mk.lng,mk.lat])}
    var el2=m.getElement();
    el2.classList.add('pin',mk.kind);el2.classList.toggle('sel',String(st.selectedId)===id);
    el2.style.background=st.colors[mk.kind];
  });
  Object.keys(markers).forEach(function(id){if(!keep[id]){markers[id].remove();delete markers[id]}});
  if(st.me){
    if(!me){var d=document.createElement('div');d.className='me';me=new maplibregl.Marker({element:d}).setLngLat([st.me.lng,st.me.lat]).addTo(map)}
    else me.setLngLat([st.me.lng,st.me.lat]);
  }else if(me){me.remove();me=null}
  setPadding(st.padding||{});
};
window.__fly=function(lat,lng,z){map.flyTo({center:[lng,lat],zoom:z,duration:600})};
map.on('load',function(){clearTimeout(failTimer);post({t:'ready'})});
__set(S);
}
</script></body></html>`;
}

export const OsmMap = forwardRef<OsmMapHandle, Props>(function OsmMap(
  { center, zoom = 13, markers = [], selectedId = null, me = null, draggable = false, interactive = true, padding, onPress, onMarkerPress, onMarkerDrag, style },
  ref
) {
  const web = useRef<WebView<{}>>(null);
  const [failed, setFailed] = useState(false);
  const state = { markers, selectedId, me, draggable, padding: padding ?? {}, colors: PIN };

  // HTML строим один раз: дальнейшие изменения передаём через __set, чтобы карта не перезагружалась
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const source = useMemo(() => ({ html: html({ ...state, center, zoom, interactive }) }), []);

  const json = JSON.stringify(state);
  useEffect(() => {
    web.current?.injectJavaScript(`window.__set && window.__set(${json}); true;`);
  }, [json]);

  useImperativeHandle(ref, () => ({
    flyTo: (p, z = 16) => web.current?.injectJavaScript(`window.__fly && window.__fly(${p.lat},${p.lng},${z}); true;`),
  }));

  const onMessage = (e: WebViewMessageEvent) => {
    let m: any;
    try {
      m = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (m.t === "press") onPress?.({ lat: m.lat, lng: m.lng });
    else if (m.t === "marker") onMarkerPress?.(m.id);
    else if (m.t === "drag") onMarkerDrag?.({ lat: m.lat, lng: m.lng });
    else if (m.t === "error") setFailed(true);
    else if (m.t === "ready") web.current?.injectJavaScript(`window.__set && window.__set(${json}); true;`);
  };

  return (
    <View style={[s.box, style]}>
      <MapWebView
        ref={web}
        source={source}
        originWhitelist={["*"]}
        onMessage={onMessage}
        onError={() => setFailed(true)}
        javaScriptEnabled
        domStorageEnabled
        nestedScrollEnabled
        overScrollMode="never"
        setSupportMultipleWindows={false}
        style={s.web}
      />
      {failed && (
        <View style={s.fail}>
          <AppText variant="bodyStrong">Карта не загрузилась</AppText>
          <AppText variant="caption" style={{ textAlign: "center" }}>
            Проверьте интернет и откройте экран ещё раз
          </AppText>
        </View>
      )}
    </View>
  );
});

const s = StyleSheet.create({
  box: { overflow: "hidden", backgroundColor: color.sand },
  web: { flex: 1, backgroundColor: color.sand },
  fail: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 16,
    backgroundColor: color.sand,
  },
});
