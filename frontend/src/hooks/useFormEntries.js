"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { getEntries, getEntriesByTableSlug } from "@/services/formEntryService";

/**
 * Fetches entries two possible ways:
 *  - by tableSlug (dynamic admin table route — preferred, gives back
 *    { form, columns, data, ... } with columns derived from the form)
 *  - by formId / generic filters (internal/back-office use, e.g. a
 *    preview panel inside FormBuilder)
 *
 * Pass { tableSlug, ...params } to use the table-route path; pass any
 * other params shape (formId, status, search, etc.) for the generic path.
 */
export default function useFormEntries({ tableSlug, ...params } = {}) {
  return useQuery({
    queryKey: tableSlug ? ["form-entries", "table", tableSlug, params] : ["form-entries", params],

    queryFn: async () => {
      const { data } = tableSlug
        ? await getEntriesByTableSlug(tableSlug, params)
        : await getEntries(params);

      return data;
    },

    enabled: tableSlug ? Boolean(tableSlug) : true,

    placeholderData: keepPreviousData,
  });
}