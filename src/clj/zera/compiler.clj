(ns zera.compiler)

(deftype Env [vars parent])

(defn env
  ([] (Env. {} nil))
  ([vars] (Env. vars nil))
  ([vars parent] (Env. vars parent)))

(defn emit-comma-list
  [xs]
  (if (empty? xs)
    ""
    (reduce #(str %1 ", " %2) xs)))

(defn emit-nil
  [x] "null")

(defn self-evaluating?
  [x] (or (string? x) (number? x)))

; TODO: add more advanced string features
(def emit-self-evaluating pr-str)

(defn emit-keyword [kw]
  (let [ns (namespace kw)
        nm (name kw)]
    (if ns
      (str "zera.core.keyword(\"" ns "\", \"" nm "\")")
      (str "zera.core.keyword(null, \"" nm "\")"))))

(defn emit-vector [v env]
  (let [elems (->> v (map #(emit % env)) emit-comma-list)]
    (str "zera.core.vector(" elems ")")))

(defn emit-map [m env]
  (let [pairs (->> m
                   (mapcat #(vector (emit (% 0) env) (emit (% 1) env)))
                   emit-comma-list)]
    (str "zera.core.hashMap(" pairs ")")))

(def tagged-value-or-application? list?)

(defn emit-application
  [form env]
  (let [args (->> (rest form)
                  emit-comma-list
                  (map #(emit % env)))]
    (str (emit (first form) env) ".call(null, " args ")")))

(defn emit-tagged-value-or-application [form env]
  (let [x (first form)]
    (if (symbol? x)
      (case x
        'quote (emit-quote form)
        'def   (emit-def form)
        'fn    (emit-fn form env)
      (emit-application form env)
      ))
  )

(defn emit [form env]
  (cond (nil? form) "null"
        (self-evaluating? form) (emit-self-evaluating form)
        (keyword? form) (emit-keyword form)
        (vector? form) (emit-vector form env)
        (map? form) (emit-map form env)
        (tagged-value-or-application? form)
          (emit-tagged-value-or-application form env)
        :else
          (throw (Exception. (str "Unknown form " form)))))

(def ^:private top (env))

(defn compile
  ([form] (emit form top))
  ([form env] (emit form env)))
