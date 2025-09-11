import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";

interface SearchFiltersProps {
  onFilter: (filters: {
    search: string;
    serviceType: string;
    dateFrom: string;
    dateTo: string;
  }) => void;
}

export function SearchFilters({ onFilter }: SearchFiltersProps) {
  const [search, setSearch] = useState("");
  const [serviceType, setServiceType] = useState("ALL_TYPES"); // ✅ Default value
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (value: string) => {
    setSearch(value);
    onFilter({ search: value, serviceType, dateFrom, dateTo });
  };

  const handleFilterChange = () => {
    onFilter({ search, serviceType, dateFrom, dateTo });
  };

  const clearFilters = () => {
    setSearch("");
    setServiceType("ALL_TYPES"); // ✅ Reset correctly
    setDateFrom("");
    setDateTo("");
    onFilter({
      search: "",
      serviceType: "ALL_TYPES",
      dateFrom: "",
      dateTo: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone number..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 h-12"
        />
      </div>
    </div>
  );
}
