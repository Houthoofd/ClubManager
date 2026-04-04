/**
 * CoursesListPage
 *
 * Page displaying the list of available courses with filters.
 * Following FSD architecture and using PatternFly components.
 */

import React, { useState } from "react";
import {
  Page,
  PageSection,
  Title,
  TextContent,
  Text,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
} from "@patternfly/react-core";
import { CoursesList } from "@/features/courses";
import type { CourseFilters } from "@/features/courses";

/**
 * Page principale pour afficher la liste des cours
 */
export const CoursesListPage: React.FC = () => {
  const [filters, setFilters] = useState<CourseFilters>({});
  const [searchValue, setSearchValue] = useState("");

  /**
   * Gestion du changement de recherche
   */
  const handleSearchChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string,
  ) => {
    setSearchValue(value);
    setFilters((prev) => ({
      ...prev,
      search: value || undefined,
    }));
  };

  /**
   * Gestion de l'effacement de la recherche
   */
  const handleSearchClear = () => {
    setSearchValue("");
    setFilters((prev) => {
      const { search, ...rest } = prev;
      return rest;
    });
  };

  return (
    <Page>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Nos Cours
        </Title>
        <TextContent>
          <Text component="p">
            Découvrez notre catalogue de cours et inscrivez-vous dès maintenant
          </Text>
        </TextContent>
      </PageSection>

      <PageSection>
        <Toolbar id="courses-toolbar">
          <ToolbarContent>
            <ToolbarItem variant="search-filter">
              <SearchInput
                placeholder="Rechercher un cours..."
                value={searchValue}
                onChange={handleSearchChange}
                onClear={handleSearchClear}
                aria-label="Rechercher un cours"
              />
            </ToolbarItem>
            {/* TODO: Add more filter controls here (type, level, status) */}
          </ToolbarContent>
        </Toolbar>

        <CoursesList filters={filters} />
      </PageSection>
    </Page>
  );
};
