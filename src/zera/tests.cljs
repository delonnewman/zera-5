(ns zera.tests
  (:require [cljs.test :refer-macros [deftest is testing run-tests]]))

(deftest test-equals
  (is (not= 1 1)))

(defn -main [args]
  (enable-console-print!)
  (run-tests))
