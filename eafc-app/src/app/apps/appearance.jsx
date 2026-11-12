import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StatusBar, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import { Button, Card, IconButton, SectionLabel, Slider, TextField } from '@/components/ui';
import { Screen } from '@/components/ui';
import useT from '@/hooks/useT';
import {
  customThemeFromUser, customThemeToUser, isHexColor, readCustomTheme, writeCustomTheme,
} from '@/lib/customTheme';
import {
  LIVE_DARK_BG_OPTIONS,
  LIVE_DARK_BLUR_MAX,
  LIVE_DARK_MAX_UPLOADS,
  LIVE_DARK_OVERLAY_MAX,
  addLiveDarkUpload,
  clearLiveDarkUpload,
  filledUploadCount,
  getLiveDarkBgPreference,
  getLiveDarkFx,
  getLiveDarkUploadSlots,
  replaceLiveDarkUpload,
  setLiveDarkBgPreference,
  setLiveDarkFx,
} from '@/lib/liveDarkBackground';

const THEMES = [
  { id: 'theme-dark', key: 'dark' },
  { id: 'theme-video', key: 'liveDark' },
  { id: 'theme-custom', key: 'custom' },
];

const COLOUR_FIELDS = [
  { field: 'primaryColor', key: 'primary' },
  { field: 'gradientColor', key: 'gradient' },
  { field: 'backgroundColor', key: 'background' },
  { field: 'textColor', key: 'text' },
  { field: 'primaryTextColor', key: 'primaryText' },
  { field: 'secondaryTextColor', key: 'secondaryText' },
];

function ThemeTile({ label, selected, onPress, swatch }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ flex: 1, gap: 8, alignItems: 'center', minHeight: 44 }}
    >
      <View
        style={{
          width: '100%',
          height: 96,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: selected ? tokens.cyan : tokens.border,
          backgroundColor: swatch,
        }}
      />
      <Text style={{ color: selected ? tokens.cyan : tokens.text, fontSize: 14, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function ColourRow({ label, value, hint, onCommit }) {
  const tokens = useThemeStore((s) => s.tokens);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  const valid = isHexColor(draft);
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
        <View
          style={{
            width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: tokens.borderStrong,
            backgroundColor: valid ? draft : value, marginBottom: 3,
          }}
        />
        <View style={{ flex: 1 }}>
          <TextField
            label={label}
            value={draft}
            error={!valid}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={7}
            onChangeText={(text) => {
              setDraft(text);
              if (isHexColor(text)) onCommit(text.trim());
            }}
          />
        </View>
      </View>
      {!valid ? <Text style={{ color: tokens.danger, fontSize: 12 }}>{hint}</Text> : null}
    </View>
  );
}

/** Appearance: Dark, Live Dark (wallpaper, own images, blur, overlay) and a real Custom theme. */
export default function AppearanceScreen() {
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const stageId = useThemeStore((s) => s.stageId);
  const setStageTheme = useThemeStore((s) => s.setStageTheme);
  const refreshTheme = useThemeStore((s) => s.refresh);

  const [custom, setCustom] = useState(() => readCustomTheme());
  const [bg, setBg] = useState(() => getLiveDarkBgPreference());
  const [slots, setSlots] = useState(() => getLiveDarkUploadSlots());
  const [fx, setFx] = useState(() => getLiveDarkFx());
  const [status, setStatus] = useState('idle');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    stageClient.auth.me()
      .then((me) => {
        const saved = customThemeFromUser(me);
        if (!saved || cancelled) return;
        setCustom(writeCustomTheme(saved));
        refreshTheme();
      })
      .catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isCustom = stageId === 'theme-custom';
  const isLive = stageId === 'theme-video';

  const updateCustom = (patch) => {
    setStatus('idle');
    setCustom(writeCustomTheme(patch));
    refreshTheme();
  };

  const pickBackground = (id) => {
    setBg(setLiveDarkBgPreference(id));
    refreshTheme();
  };

  const afterUploadChange = () => {
    setSlots(getLiveDarkUploadSlots());
    setBg(getLiveDarkBgPreference());
    refreshTheme();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return result.assets[0];
  };

  const upload = async (forcedIndex = null) => {
    if (forcedIndex == null && filledUploadCount(slots) >= LIVE_DARK_MAX_UPLOADS) {
      Alert.alert(t('settingsPage.stgLiveDarkUploadFullTitle'), t('settingsPage.stgLiveDarkUploadFullDesc'));
      return;
    }
    const asset = await pickImage();
    if (!asset) return;
    const result = forcedIndex != null ? replaceLiveDarkUpload(forcedIndex, asset.uri) : addLiveDarkUpload(asset.uri);
    if (!result.ok) {
      Alert.alert(t('settingsPage.stgLiveDarkUploadFullTitle'), t('settingsPage.stgLiveDarkUploadFullDesc'));
      return;
    }
    setBg(setLiveDarkBgPreference(`custom-${result.index ?? forcedIndex}`));
    afterUploadChange();
  };

  const removeUpload = (index) => {
    clearLiveDarkUpload(index);
    afterUploadChange();
  };

  const save = async () => {
    setStatus('saving');
    setSaveError('');
    try {
      await stageClient.auth.updateMe(customThemeToUser(custom));
      setStatus('saved');
    } catch (err) {
      setSaveError(err?.message || t('stage.appearance.saveFailed'));
      setStatus('error');
    }
  };

  const swatches = {
    'theme-dark': tokens.bgDeep,
    'theme-video': tokens.card,
    'theme-custom': custom.backgroundColor,
  };

  return (
    <Screen tabBar={false} keyboardAvoiding style={{ gap: 16 }}>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="arrow-back" accessibilityLabel={t('stage.state.back')} onPress={() => router.back()} />
        <SectionLabel>{t('stage.appearance.title')}</SectionLabel>
        <View style={{ width: 44, height: 44 }} />
      </View>

      <SectionLabel>{t('stage.appearance.theme')}</SectionLabel>
      <View accessibilityRole="radiogroup" accessibilityLabel={t('stage.appearance.themeLabel')} style={{ flexDirection: 'row', gap: 12 }}>
        {THEMES.map((item) => (
          <ThemeTile
            key={item.id}
            label={t(`stage.appearance.${item.key}`)}
            selected={stageId === item.id}
            swatch={swatches[item.id]}
            onPress={() => setStageTheme(item.id)}
          />
        ))}
      </View>

      {isLive ? (
        <Card style={{ gap: 14 }}>
          <SectionLabel>{t('stage.appearance.liveBackground')}</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {LIVE_DARK_BG_OPTIONS.map((opt) => {
              const label = t(`settingsPage.${opt.labelKey}`);
              const selected = bg === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  accessibilityRole="radio"
                  accessibilityLabel={label}
                  accessibilityState={{ selected }}
                  onPress={() => pickBackground(opt.id)}
                  style={{
                    flex: 1, height: 64, borderRadius: 12, borderWidth: 2, overflow: 'hidden', justifyContent: 'flex-end',
                    borderColor: selected ? tokens.cyan : tokens.border, backgroundColor: tokens.cardHi, padding: 6,
                  }}
                >
                  {opt.src ? <Image source={opt.src} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} /> : null}
                  <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 11, fontWeight: '700' }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Text style={{ color: tokens.textSoft, fontSize: 13 }}>
              {t('stage.appearance.myImages', { count: filledUploadCount(slots), max: LIVE_DARK_MAX_UPLOADS })}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('stage.appearance.addImage')}
              onPress={() => upload()}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ color: tokens.cyan, fontSize: 14, fontWeight: '700' }}>{t('stage.appearance.addImage')}</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {slots.map((src, index) => (
              <Pressable
                key={`slot-${index}`}
                accessibilityRole="button"
                accessibilityLabel={src ? t('stage.appearance.useUpload', { n: index + 1 }) : t('stage.appearance.uploadSlot', { n: index + 1 })}
                accessibilityActions={src ? [{ name: 'remove', label: t('stage.appearance.removeUpload', { n: index + 1 }) }] : undefined}
                onAccessibilityAction={(e) => { if (e.nativeEvent.actionName === 'remove') removeUpload(index); }}
                onPress={() => (src ? pickBackground(`custom-${index}`) : upload(index))}
                onLongPress={() => src && removeUpload(index)}
                style={{
                  flex: 1, aspectRatio: 1, minHeight: 44, borderRadius: 12, borderWidth: 2, overflow: 'hidden',
                  alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bgDeep,
                  borderColor: bg === `custom-${index}` ? tokens.cyan : tokens.border,
                }}
              >
                {src ? (
                  <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={{ color: tokens.muted, fontSize: 11 }}>{t('settingsPage.stgLiveDarkSlotEmpty', { n: index + 1 })}</Text>
                )}
              </Pressable>
            ))}
          </View>

          <View style={{ gap: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: tokens.textSoft, fontSize: 14 }}>{t('stage.appearance.blur')}</Text>
              <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '700' }}>{String(Math.round(fx.blur))}</Text>
            </View>
            <Slider
              accessibilityLabel={t('stage.appearance.blur')}
              min={0}
              max={LIVE_DARK_BLUR_MAX}
              step={1}
              value={fx.blur}
              valueText={`${Math.round(fx.blur)}`}
              onChange={(blur) => { setFx(setLiveDarkFx({ blur })); refreshTheme(); }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: tokens.textSoft, fontSize: 14 }}>{t('stage.appearance.overlay')}</Text>
              <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '700' }}>{`${Math.round(fx.overlay * 100)}%`}</Text>
            </View>
            <Slider
              accessibilityLabel={t('stage.appearance.overlay')}
              min={0}
              max={LIVE_DARK_OVERLAY_MAX}
              step={0.05}
              value={fx.overlay}
              valueText={`${Math.round(fx.overlay * 100)}%`}
              onChange={(overlay) => { setFx(setLiveDarkFx({ overlay })); refreshTheme(); }}
            />
          </View>
        </Card>
      ) : null}

      <Card testID="custom-colours" style={{ gap: 14, opacity: isCustom ? 1 : 0.6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <SectionLabel>{t('stage.appearance.customColours')}</SectionLabel>
          {!isCustom ? <Text style={{ color: tokens.muted, fontSize: 12, flexShrink: 1 }}>{t('stage.appearance.whenCustom')}</Text> : null}
        </View>
        {!isCustom ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[
              { field: 'primaryColor', key: 'primary' },
              { field: 'gradientColor', key: 'gradient' },
              { field: 'backgroundColor', key: 'background' },
            ].map(({ field, key }) => (
              <View key={field} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 26, height: 26, borderRadius: 13,
                    backgroundColor: custom[field], borderWidth: 1, borderColor: tokens.borderStrong,
                  }}
                />
                <Text style={{ color: tokens.textSoft, fontSize: 12 }}>{t(`stage.appearance.${key}`)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <>
            {COLOUR_FIELDS.map(({ field, key }) => (
              <ColourRow
                key={field}
                label={t(`stage.appearance.${key}`)}
                value={custom[field]}
                hint={t('stage.appearance.hexHint')}
                onCommit={(hex) => updateCustom({ [field]: hex })}
              />
            ))}
            <View style={{ gap: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: tokens.textSoft, fontSize: 14 }}>{t('stage.appearance.backgroundOpacity')}</Text>
                <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '700' }}>{`${Math.round(custom.backgroundOpacity * 100)}%`}</Text>
              </View>
              <Slider
                accessibilityLabel={t('stage.appearance.backgroundOpacity')}
                min={0.3}
                max={1}
                step={0.05}
                value={custom.backgroundOpacity}
                valueText={`${Math.round(custom.backgroundOpacity * 100)}%`}
                onChange={(backgroundOpacity) => updateCustom({ backgroundOpacity })}
              />
            </View>
          </>
        )}
      </Card>

      {status === 'error' ? <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 13 }}>{saveError}</Text> : null}
      <Button
        title={(status === 'saving' ? t('stage.appearance.saving') : status === 'saved' ? t('stage.appearance.saved') : t('stage.appearance.save')).toUpperCase()}
        accessibilityLabel={status === 'saved' ? t('stage.appearance.saved') : t('stage.appearance.save')}
        loading={status === 'saving'}
        onPress={save}
      />
    </Screen>
  );
}
