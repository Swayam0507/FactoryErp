'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Save, Loader2, Upload, Factory, MessageSquare, Shield } from 'lucide-react';
import type { FactorySettings } from '@/types';

export default function SettingsPage() {
  const supabase = createClient();
  const { isSuperAdmin } = useAuth();
  const [settings, setSettings] = useState<FactorySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [tab, setTab] = useState<'factory' | 'whatsapp'>('factory');

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('factory_settings').select('*').single();
      if (data) { setSettings(data as FactorySettings); setLogoPreview(data.logo_url || null); }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!settings) return;
    if (!isSuperAdmin) { toast.error('Only Super Admin can change settings'); return; }
    setSaving(true);

    let logoUrl = settings.logo_url;

    // Upload logo if changed
    if (logoFile) {
      const ext = logoFile.name.split('.').pop();
      const path = `logos/factory-logo.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('factory-assets')
        .upload(path, logoFile, { upsert: true });

      if (uploadErr) {
        toast.error('Logo upload failed: ' + uploadErr.message);
      } else {
        const { data: { publicUrl } } = supabase.storage.from('factory-assets').getPublicUrl(path);
        logoUrl = publicUrl;
      }
    }

    const { error } = await supabase
      .from('factory_settings')
      .update({
        factory_name: settings.factory_name,
        factory_address: settings.factory_address,
        logo_url: logoUrl,
        whatsapp_phone_id: settings.whatsapp_phone_id,
        whatsapp_token: settings.whatsapp_token,
        whatsapp_enabled: settings.whatsapp_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) toast.error(error.message);
    else {
      toast.success('Settings saved!');
      setSettings((prev) => prev ? { ...prev, logo_url: logoUrl } : prev);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl skeleton-shimmer" />)}
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="text-slate-500 font-medium">Access Denied</p>
        <p className="text-slate-400 text-sm">Only Super Admins can access settings</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage factory configuration and integrations</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'factory' as const, label: 'Factory Info', icon: Factory },
          { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageSquare },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
              tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        {tab === 'factory' && (
          <>
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Factory Logo</label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt="Factory Logo" className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-slate-50 p-1" />
                ) : (
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50">
                    <Factory className="w-6 h-6 text-slate-300" />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  Upload Logo
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Factory Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Factory Name</label>
              <input
                type="text"
                value={settings?.factory_name || ''}
                onChange={(e) => setSettings((s) => s ? { ...s, factory_name: e.target.value } : s)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Factory Address */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Factory Address</label>
              <textarea
                value={settings?.factory_address || ''}
                onChange={(e) => setSettings((s) => s ? { ...s, factory_address: e.target.value } : s)}
                rows={3}
                placeholder="Full address for salary slips…"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </>
        )}

        {tab === 'whatsapp' && (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">WhatsApp Business API Setup</p>
              <p className="text-blue-600 dark:text-blue-400">Configure your Meta WhatsApp Business API credentials. Get these from your Meta Business Manager → WhatsApp → API Setup.</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable WhatsApp Notifications</p>
                <p className="text-xs text-slate-400 mt-0.5">Send attendance, advance, and salary notifications</p>
              </div>
              <button
                onClick={() => setSettings((s) => s ? { ...s, whatsapp_enabled: !s.whatsapp_enabled } : s)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings?.whatsapp_enabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings?.whatsapp_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number ID</label>
              <input
                type="text"
                value={settings?.whatsapp_phone_id || ''}
                onChange={(e) => setSettings((s) => s ? { ...s, whatsapp_phone_id: e.target.value } : s)}
                placeholder="1234567890123456"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Access Token</label>
              <input
                type="password"
                value={settings?.whatsapp_token || ''}
                onChange={(e) => setSettings((s) => s ? { ...s, whatsapp_token: e.target.value } : s)}
                placeholder="EAAxxxxxxxxxxxxxxxx…"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition shadow-sm disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}
