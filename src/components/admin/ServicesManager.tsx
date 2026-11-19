"use client";

import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { prepareImageUpload } from "@/lib/images/prepare-upload";
import {
  addTreatment,
  deleteTreatment,
  discardTreatmentImageUpload,
  prepareTreatmentImageUpload,
  reorderTreatments,
  setTreatmentStatus,
  updateTreatment,
} from "@/app/admin/services/actions";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type Treatment = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: string;
  image: string | null;
  imageAlt: string;
  imageStoragePath: string | null;
  featured: boolean;
  sortOrder: number;
  active: boolean;
};

type Category = {
  id: string;
  name: string;
};

type CategoryWithTreatments = Category & {
  description: string;
  sortOrder: number;
  active: boolean;
  treatments: Treatment[];
};

type FormState = {
  name: string;
  categoryId: string;
  description: string;
  durationMinutes: number;
  price: number;
  imageAlt: string;
  featured: boolean;
};

function numericPrice(price: string) {
  const normalized = price.replace(/[^0-9,.-]/g, "").replace(",", ".");
  return Number.parseFloat(normalized) || 0;
}

function TreatmentDialog({
  treatment,
  categories,
  onClose,
}: {
  treatment: Treatment | null;
  categories: Category[];
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );
  const [form, setForm] = useState<FormState>({
    name: treatment?.name ?? "",
    categoryId: treatment?.categoryId ?? categories[0]?.id ?? "",
    description: treatment?.description ?? "",
    durationMinutes: treatment?.durationMinutes ?? 30,
    price: treatment ? numericPrice(treatment.price) : 0,
    imageAlt: treatment?.imageAlt ?? "",
    featured: treatment?.featured ?? false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    let newStoragePath: string | null = null;
    try {
      let image = removeImage ? null : treatment?.image ?? null;
      let imageStoragePath = removeImage ? null : treatment?.imageStoragePath ?? null;

      if (imageFile) {
        if (!ACCEPTED_IMAGE_TYPES.includes(imageFile.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
          throw new Error("Brug et JPG-, PNG- eller WebP-billede.");
        }
        if (imageFile.size > MAX_IMAGE_SIZE) throw new Error("Billedet må højst fylde 5 MB.");

        const uploadFile = await prepareImageUpload(imageFile);
        const prepared = await prepareTreatmentImageUpload({
          mimeType: uploadFile.type as (typeof ACCEPTED_IMAGE_TYPES)[number],
          fileSize: uploadFile.size,
        });
        if (!prepared.success || !prepared.storagePath || !prepared.token) {
          throw new Error(prepared.error || "Upload kunne ikke forberedes.");
        }
        newStoragePath = prepared.storagePath;
        const uploaded = await supabase.storage
          .from("services")
          .uploadToSignedUrl(prepared.storagePath, prepared.token, uploadFile, {
            cacheControl: "31536000",
            contentType: uploadFile.type,
          });
        if (uploaded.error) throw new Error(uploaded.error.message);

        image = supabase.storage.from("services").getPublicUrl(prepared.storagePath).data.publicUrl;
        imageStoragePath = prepared.storagePath;
      }

      const payload = { ...form, image, imageStoragePath };
      const result = treatment
        ? await updateTreatment(treatment.id, payload)
        : await addTreatment(payload);
      if (!result.success) {
        if (newStoragePath) await discardTreatmentImageUpload(newStoragePath);
        throw new Error(result.error || "Behandlingen kunne ikke gemmes.");
      }

      router.refresh();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Behandlingen kunne ikke gemmes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="treatment-dialog-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 id="treatment-dialog-title" className="text-lg font-bold text-gray-900">
            {treatment ? "Redigér behandling" : "Tilføj behandling"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Luk" className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Navn
              <input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 px-3 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20" />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Kategori
              <select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 px-3 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20">
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium text-gray-700">
            Beskrivelse
            <textarea rows={3} maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20" placeholder="Kort beskrivelse til forsiden" />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Varighed i minutter
              <input type="number" required min={5} max={480} step={5} value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 px-3 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20" />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Pris i kr.
              <input type="number" required min={0} max={100000} step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 px-3 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20" />
            </label>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex aspect-video w-full max-w-44 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-400">
                {imageFile ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={URL.createObjectURL(imageFile)} alt="Forhåndsvisning" className="h-full w-full object-cover" />
                ) : treatment?.image && !removeImage ? (
                  <Image src={treatment.image} alt={treatment.imageAlt || treatment.name} fill className="object-cover" />
                ) : (
                  <ImagePlus className="h-8 w-8" aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Behandlingsbillede
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setImageFile(event.target.files?.[0] ?? null); setRemoveImage(false); }} className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:font-semibold file:text-white hover:file:bg-emerald-800" />
                </label>
                <p className="text-xs text-gray-500">JPG, PNG eller WebP · maks. 5 MB original; komprimeres automatisk ved upload</p>
                {treatment?.image ? (
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={removeImage} onChange={(event) => { setRemoveImage(event.target.checked); if (event.target.checked) setImageFile(null); }} className="h-4 w-4 accent-emerald-700" /> Fjern nuværende billede
                  </label>
                ) : null}
              </div>
            </div>
            <label className="mt-4 block text-sm font-medium text-gray-700">
              Beskrivende billedtekst
              <input maxLength={180} value={form.imageAlt} onChange={(event) => setForm({ ...form, imageAlt: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 px-3 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20" placeholder="Beskriv hvad billedet viser" />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} className="h-4 w-4 accent-emerald-700" /> Markér som populær på forsiden
          </label>

          {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
            <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">Annuller</button>
            <button type="submit" disabled={isSaving} className="min-h-11 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{isSaving ? "Gemmer…" : "Gem behandling"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServicesManager({
  categoriesWithTreatments,
  allCategories,
}: {
  categoriesWithTreatments: CategoryWithTreatments[];
  allCategories: Category[];
}) {
  const router = useRouter();
  const [dialogTreatment, setDialogTreatment] = useState<Treatment | null | undefined>(undefined);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (id: string, action: () => Promise<{ success: boolean; error?: string; warning?: string }>) => {
    setBusyId(id);
    setFeedback(null);
    const result = await action();
    setFeedback(result.success ? result.warning || "Ændringen er gemt." : result.error || "Handlingen mislykkedes.");
    if (result.success) router.refresh();
    setBusyId(null);
  };

  const move = async (category: CategoryWithTreatments, index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= category.treatments.length) return;
    const ids = category.treatments.map((treatment) => treatment.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await run(category.treatments[index].id, () => reorderTreatments(category.id, ids));
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">Ændringer vises på forsiden og i online booking.</p>
        <button type="button" onClick={() => setDialogTreatment(null)} disabled={allCategories.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50">
          <Plus className="h-4 w-4" aria-hidden="true" /> Tilføj behandling
        </button>
      </div>

      {feedback ? <p role="status" className="mb-4 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">{feedback}</p> : null}

      <div className="space-y-6">
        {categoriesWithTreatments.map((category) => (
          <section key={category.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" aria-labelledby={`category-${category.id}`}>
            <div className="border-b border-gray-200 bg-gray-50/60 px-5 py-4">
              <h2 id={`category-${category.id}`} className="text-lg font-semibold text-gray-900">{category.name}</h2>
              {category.description ? <p className="mt-1 text-sm text-gray-500">{category.description}</p> : null}
            </div>

            {category.treatments.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-500">Ingen behandlinger i denne kategori.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-white text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold" scope="col">Behandling</th>
                      <th className="px-5 py-3 font-semibold" scope="col">Varighed</th>
                      <th className="px-5 py-3 font-semibold" scope="col">Pris</th>
                      <th className="px-5 py-3 font-semibold" scope="col">Status</th>
                      <th className="px-5 py-3 text-right font-semibold" scope="col">Handlinger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {category.treatments.map((treatment, index) => (
                      <tr key={treatment.id} className="hover:bg-gray-50/60">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                              {treatment.image ? <Image src={treatment.image} alt={treatment.imageAlt || treatment.name} fill sizes="80px" className="object-cover" /> : <ImagePlus className="absolute inset-0 m-auto h-5 w-5 text-gray-400" aria-hidden="true" />}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{treatment.name}</p>
                              {treatment.featured ? <span className="text-xs font-medium text-amber-700">Populær</span> : null}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-gray-600">{treatment.durationMinutes} min</td>
                        <td className="whitespace-nowrap px-5 py-3 font-medium text-gray-900">{treatment.price}</td>
                        <td className="px-5 py-3">
                          <button type="button" disabled={busyId === treatment.id} onClick={() => run(treatment.id, () => setTreatmentStatus(treatment.id, !treatment.active))} className={`rounded-full border px-3 py-1 text-xs font-semibold ${treatment.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                            {treatment.active ? "Aktiv" : "Inaktiv"}
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <button type="button" onClick={() => move(category, index, -1)} disabled={busyId !== null || index === 0} aria-label={`Flyt ${treatment.name} op`} className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
                            <button type="button" onClick={() => move(category, index, 1)} disabled={busyId !== null || index === category.treatments.length - 1} aria-label={`Flyt ${treatment.name} ned`} className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
                            <button type="button" onClick={() => setDialogTreatment(treatment)} aria-label={`Redigér ${treatment.name}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
                            <button type="button" disabled={busyId === treatment.id} onClick={() => { if (window.confirm(`Slet “${treatment.name}” permanent?`)) run(treatment.id, () => deleteTreatment(treatment.id)); }} aria-label={`Slet ${treatment.name}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>

      {dialogTreatment !== undefined ? (
        <TreatmentDialog treatment={dialogTreatment} categories={allCategories} onClose={() => setDialogTreatment(undefined)} />
      ) : null}
    </div>
  );
}
