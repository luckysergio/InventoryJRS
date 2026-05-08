<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductInternalController extends Controller
{
    /**
     * Get all internal products (not belonging to any distributor or customer)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = Product::with([
            'jenis',
            'type',
            'bahan',
            'hargaProducts' => function ($q) {
                $q->whereNull('customer_id')
                    ->orderBy('tanggal_berlaku', 'desc')
                    ->limit(1);
            },
            'inventories.place' => function ($q) {
                $q->whereIn('kode', ['TOKO', 'BENGKEL']);
            }
        ])
        // Filter hanya produk internal (tidak memiliki distributor dan customer)
        ->whereNull('distributor_id')
        ->whereNull('customer_id');

        // Search filter
        if ($request->filled('search')) {
            $searchTerm = "%{$request->search}%";
            $query->where(function ($q) use ($searchTerm) {
                $q->where('kode', 'like', $searchTerm)
                    ->orWhereHas('jenis', function ($q) use ($searchTerm) {
                        $q->where('nama', 'like', $searchTerm);
                    })
                    ->orWhereHas('type', function ($q) use ($searchTerm) {
                        $q->where('nama', 'like', $searchTerm);
                    })
                    ->orWhereHas('bahan', function ($q) use ($searchTerm) {
                        $q->where('nama', 'like', $searchTerm);
                    })
                    ->orWhere('ukuran', 'like', $searchTerm);
            });
        }

        // Filter by jenis
        if ($request->filled('jenis_id')) {
            $query->where('jenis_id', $request->jenis_id);
        }

        // Filter by type
        if ($request->filled('type_id')) {
            $query->where('type_id', $request->type_id);
        }

        // Filter by bahan
        if ($request->filled('bahan_id')) {
            $query->where('bahan_id', $request->bahan_id);
        }

        // Filter by minimum stock
        if ($request->filled('min_stock')) {
            $query->whereHas('inventories', function ($q) use ($request) {
                $q->havingRaw('SUM(qty) >= ?', [$request->min_stock]);
            });
        }

        // Filter by maximum stock
        if ($request->filled('max_stock')) {
            $query->whereHas('inventories', function ($q) use ($request) {
                $q->havingRaw('SUM(qty) <= ?', [$request->max_stock]);
            });
        }

        // Filter by price range
        if ($request->filled('min_price') || $request->filled('max_price')) {
            $query->whereHas('hargaProducts', function ($q) use ($request) {
                $q->whereNull('customer_id');
                if ($request->filled('min_price')) {
                    $q->where('harga', '>=', $request->min_price);
                }
                if ($request->filled('max_price')) {
                    $q->where('harga', '<=', $request->max_price);
                }
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'kode');
        $sortOrder = $request->get('sort_order', 'asc');
        
        $allowedSorts = ['kode', 'ukuran', 'created_at', 'updated_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('kode', 'asc');
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $products = $query->paginate($perPage);

        // Transform data to include calculated fields
        $products->getCollection()->transform(function ($product) {
            // Get latest price
            $hargaUmum = $product->hargaProducts->first();
            $product->harga_umum = $hargaUmum ? $hargaUmum->harga : null;
            
            // Get stock quantities
            $toko = $product->inventories->firstWhere('place.kode', 'TOKO');
            $bengkel = $product->inventories->firstWhere('place.kode', 'BENGKEL');
            
            $product->qty_toko = $toko ? $toko->qty : 0;
            $product->qty_bengkel = $bengkel ? $bengkel->qty : 0;
            $product->total_stock = $product->qty_toko + $product->qty_bengkel;
            
            // Format product name
            $product->product_name = implode(' ', array_filter([
                $product->jenis->nama ?? null,
                $product->type->nama ?? null,
                $product->bahan->nama ?? null,
                $product->ukuran
            ]));
            
            // Remove unnecessary relations
            unset($product->hargaProducts);
            unset($product->inventories);
            
            return $product;
        });

        return response()->json([
            'status' => true,
            'message' => 'Berhasil mengambil data produk internal',
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'total_stock' => $products->getCollection()->sum('total_stock')
            ],
            'filters' => [
                'search' => $request->search,
                'jenis_id' => $request->jenis_id,
                'type_id' => $request->type_id,
                'bahan_id' => $request->bahan_id,
                'min_price' => $request->min_price,
                'max_price' => $request->max_price,
                'min_stock' => $request->min_stock,
                'max_stock' => $request->max_stock,
            ]
        ]);
    }

    /**
     * Get single internal product by ID
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $product = Product::with([
            'jenis',
            'type',
            'bahan',
            'hargaProducts' => function ($q) {
                $q->whereNull('customer_id')
                    ->orderBy('tanggal_berlaku', 'desc');
            },
            'inventories.place' => function ($q) {
                $q->whereIn('kode', ['TOKO', 'BENGKEL']);
            }
        ])
        ->whereNull('distributor_id')
        ->whereNull('customer_id')
        ->find($id);

        if (!$product) {
            return response()->json([
                'status' => false,
                'message' => 'Produk tidak ditemukan'
            ], 404);
        }

        // Calculate additional data
        $hargaUmum = $product->hargaProducts->first();
        $product->harga_umum = $hargaUmum ? $hargaUmum->harga : null;
        $product->harga_history = $product->hargaProducts;
        
        $toko = $product->inventories->firstWhere('place.kode', 'TOKO');
        $bengkel = $product->inventories->firstWhere('place.kode', 'BENGKEL');
        
        $product->qty_toko = $toko ? $toko->qty : 0;
        $product->qty_bengkel = $bengkel ? $bengkel->qty : 0;
        $product->total_stock = $product->qty_toko + $product->qty_bengkel;
        
        $product->product_name = implode(' ', array_filter([
            $product->jenis->nama ?? null,
            $product->type->nama ?? null,
            $product->bahan->nama ?? null,
            $product->ukuran
        ]));
        
        unset($product->hargaProducts);
        unset($product->inventories);

        return response()->json([
            'status' => true,
            'message' => 'Berhasil mengambil data produk',
            'data' => $product
        ]);
    }

    /**
     * Get internal products by jenis
     * 
     * @param int $jenisId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function byJenis($jenisId, Request $request)
    {
        $query = Product::with([
            'jenis',
            'type',
            'bahan',
            'hargaProducts' => function ($q) {
                $q->whereNull('customer_id')
                    ->orderBy('tanggal_berlaku', 'desc')
                    ->limit(1);
            }
        ])
        ->whereNull('distributor_id')
        ->whereNull('customer_id')
        ->where('jenis_id', $jenisId);

        $perPage = $request->get('per_page', 15);
        $products = $query->paginate($perPage);

        $products->getCollection()->transform(function ($product) {
            $harga = $product->hargaProducts->first();
            $product->harga_umum = $harga ? $harga->harga : null;
            unset($product->hargaProducts);
            return $product;
        });

        return response()->json([
            'status' => true,
            'message' => 'Berhasil mengambil produk berdasarkan jenis',
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ]
        ]);
    }

    /**
     * Get internal products with low stock (less than threshold)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function lowStock(Request $request)
    {
        $threshold = $request->get('threshold', 20);
        
        $products = Product::whereNull('distributor_id')
            ->whereNull('customer_id')
            ->whereHas('inventories', function ($q) use ($threshold) {
                $q->whereHas('place', function ($p) {
                    $p->whereIn('kode', ['TOKO', 'BENGKEL']);
                });
            })
            ->with([
                'jenis',
                'type',
                'bahan',
                'inventories' => function ($q) {
                    $q->whereHas('place', function ($p) {
                        $p->whereIn('kode', ['TOKO', 'BENGKEL']);
                    });
                },
                'inventories.place'
            ])
            ->get()
            ->map(function ($product) use ($threshold) {
                $toko = $product->inventories->firstWhere('place.kode', 'TOKO');
                $bengkel = $product->inventories->firstWhere('place.kode', 'BENGKEL');
                
                $product->qty_toko = $toko ? $toko->qty : 0;
                $product->qty_bengkel = $bengkel ? $bengkel->qty : 0;
                $product->total_stock = $product->qty_toko + $product->qty_bengkel;
                
                $product->is_low_stock = $product->total_stock < $threshold;
                
                unset($product->inventories);
                return $product;
            })
            ->filter(function ($product) use ($threshold) {
                return $product->total_stock < $threshold;
            })
            ->values();

        return response()->json([
            'status' => true,
            'message' => "Produk dengan stok dibawah {$threshold}",
            'data' => $products,
            'threshold' => $threshold,
            'count' => $products->count()
        ]);
    }

    /**
     * Get internal products summary statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function summary()
    {
        $products = Product::whereNull('distributor_id')
            ->whereNull('customer_id')
            ->with([
                'inventories' => function ($q) {
                    $q->whereHas('place', function ($p) {
                        $p->whereIn('kode', ['TOKO', 'BENGKEL']);
                    });
                },
                'hargaProducts' => function ($q) {
                    $q->whereNull('customer_id')
                        ->orderBy('tanggal_berlaku', 'desc')
                        ->limit(1);
                }
            ])
            ->get();

        $totalProducts = $products->count();
        $totalStock = 0;
        $totalValue = 0;
        $productsWithZeroStock = 0;
        $productsWithLowStock = 0;

        foreach ($products as $product) {
            $toko = $product->inventories->firstWhere('place.kode', 'TOKO');
            $bengkel = $product->inventories->firstWhere('place.kode', 'BENGKEL');
            
            $stock = ($toko ? $toko->qty : 0) + ($bengkel ? $bengkel->qty : 0);
            $totalStock += $stock;
            
            if ($stock === 0) {
                $productsWithZeroStock++;
            }
            
            if ($stock < 20) {
                $productsWithLowStock++;
            }
            
            $price = $product->hargaProducts->first();
            if ($price && $stock > 0) {
                $totalValue += $price->harga * $stock;
            }
        }

        return response()->json([
            'status' => true,
            'message' => 'Ringkasan data produk internal',
            'data' => [
                'total_products' => $totalProducts,
                'total_stock' => $totalStock,
                'total_inventory_value' => $totalValue,
                'products_with_zero_stock' => $productsWithZeroStock,
                'products_with_low_stock' => $productsWithLowStock,
                'average_stock_per_product' => $totalProducts > 0 ? round($totalStock / $totalProducts, 2) : 0,
            ]
        ]);
    }
}